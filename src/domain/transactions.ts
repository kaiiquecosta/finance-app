import type { Transaction } from '@/domain/entities'

/** Transações geradas por renda, pagamento de conta ou investimento não são editáveis na lista. */
export function isManualExpenseTransaction(t: Transaction): boolean {
  if (t.incomeKey) return false
  if (t.billId != null) return false
  if (t.investmentId != null) return false
  if (t.amt > 0 || t.cat === 'receita') return false
  return true
}
