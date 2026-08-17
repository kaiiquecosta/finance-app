import { toISODate } from '@/domain/dates'
import type { OfxAccountKind, OfxParseResult, OfxSkippedTransaction, OfxTransaction } from './types'

const PAYMENT_HINT =
  /pagamento|pagto|credito de|cr[eé]dito recebido|pagamento de fatura|estorno|devolu[cç][aã]o/i

/** Extrai valor de tag OFX/SGML (com ou sem fechamento). */
function readTag(block: string, tag: string): string {
  const open = new RegExp(`<${tag}>([^<\\n\\r]+)`, 'i').exec(block)
  if (open) return open[1].trim()

  const closed = new RegExp(`<${tag}>([^<]+)</${tag}>`, 'i').exec(block)
  return closed ? closed[1].trim() : ''
}

function parseOfxDate(raw: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(raw.trim())
  if (!m) return toISODate(new Date())
  return `${m[1]}-${m[2]}-${m[3]}`
}

function parseStmtTrn(block: string): OfxTransaction | null {
  const fitId = readTag(block, 'FITID')
  const trnType = readTag(block, 'TRNTYPE').toUpperCase()
  const dateRaw = readTag(block, 'DTPOSTED') || readTag(block, 'DTUSER')
  const amountRaw = readTag(block, 'TRNAMT')
  const amount = Number.parseFloat(amountRaw.replace(',', '.'))

  if (!fitId || !Number.isFinite(amount) || amount === 0) return null

  const memo = readTag(block, 'MEMO')
  const name = readTag(block, 'NAME')

  return {
    fitId,
    trnType,
    date: parseOfxDate(dateRaw),
    amount,
    memo,
    name,
  }
}

function detectAccountKind(content: string): OfxAccountKind {
  if (/<CREDITCARDMSGSRSV1>/i.test(content) || /<CCSTMTRS>/i.test(content)) return 'credit'
  if (/<BANKMSGSRSV1>/i.test(content) || /<STMTRS>/i.test(content)) return 'bank'
  return 'unknown'
}

function readAccountId(content: string, kind: OfxAccountKind): string {
  if (kind === 'credit') return readTag(content, 'ACCTID') || 'cartão'
  return readTag(content, 'ACCTID') || 'conta'
}

/** Compra na fatura do cartão (exclui pagamentos, estornos e créditos). */
export function isCreditCardPurchase(txn: OfxTransaction): boolean {
  const label = `${txn.name} ${txn.memo}`.trim()
  if (PAYMENT_HINT.test(label)) return false

  const type = txn.trnType
  if (type === 'CREDIT' || type === 'PAYMENT') return false

  // Convenção BR: compras costumam vir negativas; pagamentos positivos.
  if (txn.amount < 0) return true

  if (type === 'DEBIT' || type === 'POS' || type === 'ATM') return txn.amount > 0

  return false
}

function splitStmtBlocks(content: string): string[] {
  return content
    .split(/<STMTTRN>/i)
    .slice(1)
    .map((part) => part.split(/<\/STMTTRN>/i)[0] ?? part)
}

/**
 * Lê um arquivo OFX/QFX e retorna **somente compras de cartão de crédito**.
 * Extratos de conta corrente/poupança são rejeitados em `parseOfxCreditPurchases`.
 */
export function parseOfxCreditPurchases(raw: string): OfxParseResult {
  const content = raw.replace(/^\uFEFF/, '').trim()
  const accountKind = detectAccountKind(content)
  const accountId = readAccountId(content, accountKind)

  const transactions = splitStmtBlocks(content)
    .map(parseStmtTrn)
    .filter((t): t is OfxTransaction => t !== null)

  const purchases: OfxTransaction[] = []
  const skipped: OfxSkippedTransaction[] = []

  if (accountKind === 'bank') {
    for (const txn of transactions) {
      skipped.push({
        transaction: txn,
        reason: 'Extrato de conta corrente — use apenas OFX de cartão de crédito',
      })
    }
    return { accountKind, accountId, purchases, skipped }
  }

  for (const txn of transactions) {
    if (isCreditCardPurchase(txn)) {
      purchases.push(txn)
      continue
    }
    skipped.push({
      transaction: txn,
      reason: txn.amount > 0 ? 'Pagamento ou crédito na fatura' : 'Lançamento ignorado',
    })
  }

  return { accountKind, accountId, purchases, skipped }
}
