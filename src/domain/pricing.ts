/** Preços públicos do Flux Pro (BRL). Fonte única para UI e copy. */
export const PRO_MONTHLY_BRL = 24.9
export const PRO_ANNUAL_MONTHLY_BRL = 19.99
export const PRO_ANNUAL_TOTAL_BRL = 239.88

export type BillingInterval = 'month' | 'year'

export function formatPriceBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Desconto do anual vs pagar 12× o mensal (≈20%). */
export function annualSavingsPercent(): number {
  const monthlyYear = PRO_MONTHLY_BRL * 12
  const saved = monthlyYear - PRO_ANNUAL_TOTAL_BRL
  return Math.round((saved / monthlyYear) * 100)
}

export function proMonthlyPriceLabel(): string {
  return `R$ ${formatPriceBRL(PRO_MONTHLY_BRL)}/mês`
}

export function proAnnualPriceLabel(): string {
  return `R$ ${formatPriceBRL(PRO_ANNUAL_MONTHLY_BRL)}/mês no anual`
}

export function proAnnualTotalLabel(): string {
  return `R$ ${formatPriceBRL(PRO_ANNUAL_TOTAL_BRL)}/ano`
}
