import { describe, expect, it } from 'vitest'
import {
  PRO_ANNUAL_TOTAL_BRL,
  PRO_MONTHLY_BRL,
  annualSavingsPercent,
  formatPriceBRL,
  proAnnualPriceLabel,
  proMonthlyPriceLabel,
} from './pricing'

describe('pricing', () => {
  it('formata valores em pt-BR', () => {
    expect(formatPriceBRL(24.9)).toBe('24,90')
    expect(formatPriceBRL(19.99)).toBe('19,99')
  })

  it('rótulos mensal e anual', () => {
    expect(proMonthlyPriceLabel()).toBe('R$ 24,90/mês')
    expect(proAnnualPriceLabel()).toBe('R$ 19,99/mês no anual')
  })

  it('total anual bate com 12× preço mensal do plano anual', () => {
    expect(PRO_ANNUAL_TOTAL_BRL).toBeCloseTo(19.99 * 12, 2)
    expect(annualSavingsPercent()).toBe(20)
    expect(PRO_MONTHLY_BRL * 12 - PRO_ANNUAL_TOTAL_BRL).toBeCloseTo(58.92, 2)
  })
})
