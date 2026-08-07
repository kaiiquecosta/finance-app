import { cents, type Cents } from '@/domain/money'
import { inferCategory } from '@/domain/categories'
import { toISODate } from '@/domain/dates'
import type { ISODate } from '@/domain/entities'

export type ParsedFinanceMessage = {
  kind: 'expense' | 'income'
  name: string
  amount: Cents
  cat: string
  date: ISODate
}

const INCOME_HINT =
  /^\s*(recebi|ganhei|entrada|sal[aá]rio|dep[oó]sito|credito|cr[eé]dito|pix\s+recebido)\b/i

const EXPENSE_HINT = /^\s*(gastei|paguei|comprei|gasto|sa[ií]da|debito|d[eé]bito)\b/i

/** Interpreta frases como "10 reais coxinha" ou "gastei 45 no uber". */
export function parseFinanceMessage(
  raw: string,
  asOf: Date = new Date(),
): { ok: true; data: ParsedFinanceMessage } | { ok: false; error: string } {
  let text = raw.trim()
  if (!text) return { ok: false, error: 'Digite algo como: 10 reais coxinha' }

  let kind: 'expense' | 'income' = 'expense'
  if (INCOME_HINT.test(text)) {
    kind = 'income'
    text = text.replace(INCOME_HINT, '').trim()
  } else if (EXPENSE_HINT.test(text)) {
    text = text.replace(EXPENSE_HINT, '').trim()
  } else if (/^\+\s*/.test(text)) {
    kind = 'income'
    text = text.replace(/^\+\s*/, '').trim()
  } else if (/^-\s*/.test(text)) {
    text = text.replace(/^-\s*/, '').trim()
  }

  const amountResult = extractAmount(text)
  if (!amountResult) {
    return {
      ok: false,
      error: 'Não achei o valor. Ex.: 10 reais coxinha · 45,90 uber · recebi 3000',
    }
  }

  let name = cleanupDescription(amountResult.rest)
  if (!name) name = kind === 'income' ? 'Receita' : 'Gasto'

  const cat = kind === 'income' ? 'receita' : inferCategory(name)
  const date = toISODate(asOf)

  if (amountResult.cents <= 0) {
    return { ok: false, error: 'O valor precisa ser maior que zero.' }
  }

  return {
    ok: true,
    data: { kind, name: capitalizeName(name), amount: amountResult.cents, cat, date },
  }
}

function extractAmount(text: string): { cents: Cents; rest: string } | null {
  const patterns: { re: RegExp; pick: (m: RegExpMatchArray) => string }[] = [
    {
      re: /(?:r\$?\s*)(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})?)/i,
      pick: (m) => m[1],
    },
    {
      re: /(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|rs\b|r\$)/i,
      pick: (m) => m[1],
    },
    {
      re: /(?:no|na|de|por|em)\s+(\d+(?:[.,]\d{1,2})?)(?:\s|$)/i,
      pick: (m) => m[1],
    },
    {
      re: /(?:^|\s)(\d+(?:[.,]\d{1,2})?)(?:\s|$)/,
      pick: (m) => m[1],
    },
  ]

  for (const { re, pick } of patterns) {
    const m = text.match(re)
    if (!m) continue
    const cents = parseMoneyToken(pick(m))
    if (cents == null || cents <= 0) continue
    const rest = (text.slice(0, m.index) + text.slice(m.index! + m[0].length)).trim()
    return { cents, rest }
  }
  return null
}

function parseMoneyToken(token: string): Cents | null {
  const t = token.trim().replace(/\s/g, '')
  if (!t) return null
  const br = /^(\d{1,3}(?:\.\d{3})*),(\d{1,2})$/.exec(t)
  if (br) {
    const intPart = br[1].replace(/\./g, '')
    return cents(Number(intPart) * 100 + Number(br[2].padEnd(2, '0').slice(0, 2)))
  }
  const simple = t.replace(',', '.')
  const n = Number(simple)
  if (Number.isNaN(n) || n <= 0) return null
  if (/^\d+$/.test(t.replace(',', '').replace('.', '')) && !t.includes(',') && !t.includes('.')) {
    return cents(Math.round(n * 100))
  }
  return cents(Math.round(n * 100))
}

function cleanupDescription(s: string): string {
  return s
    .replace(/\b(reais|real|r\$|rs)\b/gi, ' ')
    .replace(/\b(no|na|de|do|da|em|por|para|com)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function capitalizeName(name: string): string {
  if (!name) return name
  return name.charAt(0).toUpperCase() + name.slice(1)
}
