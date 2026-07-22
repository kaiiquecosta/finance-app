/**
 * Rendas recorrentes: previsão mensal, recebimentos do mês e auto-lançamento.
 * Portado de `legacy/index.html` (renderIncomes, toggleIncomeReceived).
 *
 * Correção de bug (decidido: corrigir com testes): no legado, `received` não era
 * persistido no banco; aqui é parte da entidade `Income` e a persistência entra
 * na Fase 2. As funções abaixo são puras; a geração de id da transação fica na
 * borda (retornamos um rascunho sem id).
 */
import { mul, sum, type Cents } from '@/domain/money'
import type { Income, Transaction } from '@/domain/entities'

const FREQ_MULTIPLIER: Record<Income['freq'], number> = {
  mensal: 1,
  quinzenal: 2,
  semanal: 4,
  variavel: 0,
}

/** Chave de mês "YYYY-MM" de uma data. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Chave de recebimento "YYYY-MM-DD" para um dia dentro de um mês. */
export function receiptKey(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, '0')}`
}

/** Total mensal previsto de uma renda (multiplicador por frequência; variável = 0). */
export function monthlyExpected(income: Income): Cents {
  return mul(income.amt, FREQ_MULTIPLIER[income.freq])
}

export function totalMonthlyExpected(incomes: Income[]): Cents {
  return sum(incomes.map(monthlyExpected))
}

/** Dias (de `income.days`) já recebidos no mês de `refMonth`. */
export function receivedDays(income: Income, refMonth: Date): number[] {
  const mk = monthKey(refMonth)
  return income.days.filter((d) => income.received.includes(receiptKey(mk, d)))
}

/** Total efetivamente recebido no mês (nº de recebimentos × valor). */
export function totalReceived(incomes: Income[], refMonth: Date): Cents {
  return sum(incomes.map((i) => mul(i.amt, receivedDays(i, refMonth).length)))
}

export type ReceiptStatus = 'none' | 'partial' | 'full'

export function receiptStatus(income: Income, refMonth: Date): ReceiptStatus {
  if (income.days.length === 0) return 'none'
  const got = receivedDays(income, refMonth).length
  if (got === 0) return 'none'
  return got === income.days.length ? 'full' : 'partial'
}

/**
 * Chaves que deveriam ser auto-marcadas como recebidas até `asOf`
 * (dia atual ≥ dia de recebimento e ainda não marcadas).
 */
export function pendingAutoReceiptKeys(income: Income, asOf: Date): string[] {
  const mk = monthKey(asOf)
  const today = asOf.getDate()
  return income.days
    .filter((d) => today >= d)
    .map((d) => receiptKey(mk, d))
    .filter((key) => !income.received.includes(key))
}

/** Rascunho da transação de receita para uma chave (sem id — atribuído na borda). */
export function receiptTransactionDraft(income: Income, key: string): Omit<Transaction, 'id'> {
  return {
    name: income.name,
    cat: 'receita',
    amt: income.amt,
    date: key,
    incomeKey: `${key}_${income.id}`,
    accountId: income.accountId ?? null,
  }
}
