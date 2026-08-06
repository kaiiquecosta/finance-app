/**
 * Agregações do dashboard (Overview). Portado de `legacy/index.html`
 * (getAccBalance, renderOverview/byCat, renderAnnualView, renderInvestPotential).
 *
 * Correção de bug (decidido: corrigir com testes): o legado somava
 * `fixedBills.filter(b => b.fixed)`, mas `fixed` nunca era persistido → o total
 * de contas fixas caía sempre em 0 no "potencial de investimento". Aqui somamos
 * o valor de todas as contas fixas.
 */
import { abs, add, max, mul, sub, sum, ZERO, formatBRL, type Cents } from '@/domain/money'
import { parseISODate } from '@/domain/dates'
import { inferCategory, resolveExpenseCategory } from '@/domain/categories'
import { billsForMonth, invoiceTotal } from './cards'
import type { BankAccount, Card, FixedBill, Subscription, Transaction } from '@/domain/entities'

/** Saldo de uma conta = saldo inicial + soma das transações vinculadas. */
export function accountBalance(account: BankAccount, txs: Transaction[]): Cents {
  const aid = String(account.id)
  const txTotal = sum(txs.filter((t) => String(t.accountId) === aid).map((t) => t.amt))
  return add(account.initialBalance, txTotal)
}

/** Saldo consolidado de todas as contas. */
export function consolidatedBalance(accounts: BankAccount[], txs: Transaction[]): Cents {
  return sum(accounts.map((a) => accountBalance(a, txs)))
}

export interface TransactionSummary {
  income: Cents
  spent: Cents
  balance: Cents
}

/** Receitas, gastos e saldo de uma lista de transações. */
export function summarizeTransactions(txs: Transaction[]): TransactionSummary {
  const income = sum(txs.filter((t) => t.amt > 0).map((t) => t.amt))
  const spent = sum(txs.filter((t) => t.amt < 0).map((t) => abs(t.amt)))
  return { income, spent, balance: sub(income, spent) }
}

/**
 * Gastos por categoria no mês: transações de gasto (exceto pagamento de fatura)
 * + lançamentos da fatura do cartão do mês (exceto parcelas retroativas pagas).
 */
export function expenseByCategory(
  txs: Transaction[],
  cards: Card[],
  month: number,
  year: number,
): Record<string, Cents> {
  const byCat: Record<string, number> = {}

  for (const t of txs) {
    if (t.amt >= 0) continue
    const d = parseISODate(t.date)
    if (d.getMonth() !== month || d.getFullYear() !== year) continue
    if (t.cat === 'cartão' && t.billId) continue // ignora pagamento de fatura
    const cat = resolveExpenseCategory(t.name, t.cat)
    byCat[cat] = (byCat[cat] ?? 0) + Math.abs(t.amt)
  }

  for (const card of cards) {
    for (const b of billsForMonth(card, month, year)) {
      if (b.pastPaid) continue
      const cat = inferCategory(b.description, 'compras')
      byCat[cat] = (byCat[cat] ?? 0) + b.amt
    }
  }

  return byCat as Record<string, Cents>
}

/** Variação percentual de gastos vs mês anterior. */
export function spendVariation(spent: Cents, prevSpent: Cents): number {
  if (prevSpent <= 0) return 0
  return ((Number(spent) - Number(prevSpent)) / Number(prevSpent)) * 100
}

/** Texto de insight do hero da Visão geral. */
export function insightMessage(
  top: { category: string; amount: Cents } | null,
  variationPct: number,
): string {
  if (!top) {
    return 'Adicione suas transações para ver insights personalizados.'
  }
  const spike =
    variationPct > 20
      ? ` Seus gastos aumentaram ${Math.round(variationPct)}% vs. mês passado. Que tal revisar?`
      : ' Você está no controle dos gastos este mês 👍'
  return `Seu maior gasto este mês foi em ${top.category} (${formatBRL(top.amount)}).${spike}`
}

/** Categoria de maior gasto (rótulo + valor) ou null. */
export function topCategory(byCat: Record<string, Cents>): { category: string; amount: Cents } | null {
  const entries = Object.entries(byCat)
  if (!entries.length) return null
  const [category, amount] = entries.sort((a, b) => b[1] - a[1])[0]
  return { category, amount: amount as Cents }
}

export interface MonthTotals {
  income: Cents
  spent: Cents
}

/**
 * Totais por mês do ano (transações + faturas de cartão + assinaturas como
 * gasto mensal fixo). Índice 0..11.
 */
export function annualByMonth(
  year: number,
  txs: Transaction[],
  cards: Card[],
  subscriptions: Subscription[],
): MonthTotals[] {
  const months = Array.from({ length: 12 }, () => ({ income: 0, spent: 0 }))

  for (const t of txs) {
    const d = parseISODate(t.date)
    if (d.getFullYear() !== year) continue
    const m = d.getMonth()
    if (t.amt > 0) months[m].income += t.amt
    else months[m].spent += Math.abs(t.amt)
  }

  for (const card of cards) {
    for (let mi = 0; mi < 12; mi++) {
      months[mi].spent += invoiceTotal(card, mi, year)
    }
  }

  for (const sub of subscriptions) {
    for (let mi = 0; mi < 12; mi++) months[mi].spent += sub.amt
  }

  return months.map((m) => ({ income: m.income as Cents, spent: m.spent as Cents }))
}

export interface AnnualSummary {
  totalIncome: Cents
  totalSpent: Cents
  balance: Cents
  monthsWithData: number
  averageSpent: Cents
}

export function annualSummary(months: MonthTotals[]): AnnualSummary {
  const totalIncome = sum(months.map((m) => m.income))
  const totalSpent = sum(months.map((m) => m.spent))
  const monthsWithData = months.filter((m) => m.income > 0 || m.spent > 0).length || 1
  return {
    totalIncome,
    totalSpent,
    balance: sub(totalIncome, totalSpent),
    monthsWithData,
    averageSpent: Math.round(totalSpent / monthsWithData) as Cents,
  }
}

/** Total mensal comprometido com contas fixas (corrige o bug do `fixed`). */
export function fixedBillsTotal(bills: FixedBill[]): Cents {
  return sum(bills.map((b) => b.amt))
}

/** Sobra mensal disponível para investir: média de receita − média de gasto − fixas. */
export function monthlyPotential(avgIncome: Cents, avgSpent: Cents, fixedTotal: Cents): Cents {
  return max(ZERO, sub(sub(avgIncome, avgSpent), fixedTotal))
}

/** Médias mensais de receita e gasto no ano (só meses com movimento). */
export function investmentAverages(
  year: number,
  txs: Transaction[],
): { avgIncome: Cents; avgSpent: Cents } {
  const byMonth = new Map<number, { inc: number; spt: number }>()
  for (const t of txs) {
    const d = parseISODate(t.date)
    if (d.getFullYear() !== year) continue
    const m = d.getMonth()
    const e = byMonth.get(m) ?? { inc: 0, spt: 0 }
    if (t.amt > 0) e.inc += t.amt
    else e.spt += Math.abs(t.amt)
    byMonth.set(m, e)
  }
  const count = byMonth.size || 1
  const values = [...byMonth.values()]
  const avgIncome = Math.round(values.reduce((s, m) => s + m.inc, 0) / count) as Cents
  const avgSpent = Math.round(values.reduce((s, m) => s + m.spt, 0) / count) as Cents
  return { avgIncome, avgSpent }
}

export interface PotentialScenario {
  label: string
  months: number
  rate: number
}

export const POTENTIAL_SCENARIOS: readonly PotentialScenario[] = [
  { label: '6 meses', months: 6, rate: 0.008 },
  { label: '1 ano', months: 12, rate: 0.008 },
  { label: '3 anos', months: 36, rate: 0.0085 },
  { label: '10 anos', months: 120, rate: 0.009 },
]

/** Valor futuro de aportes mensais (juros compostos). */
export function futureValue(monthly: Cents, months: number, rate: number): Cents {
  if (rate === 0) return mul(monthly, months)
  const factor = (Math.pow(1 + rate, months) - 1) / rate
  return Math.round(monthly * factor) as Cents
}
