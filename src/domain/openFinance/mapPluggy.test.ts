import { describe, expect, it } from 'vitest'
import {
  mapPluggyCategoryToSlug,
  mapPluggyTransactionToDraft,
  pluggyAmountToCents,
} from './mapPluggy'

describe('mapPluggyCategoryToSlug', () => {
  it('mapeia categorias comuns', () => {
    expect(mapPluggyCategoryToSlug('Food & Drink')).toBe('alimentação')
    expect(mapPluggyCategoryToSlug('Salary')).toBe('receita')
    expect(mapPluggyCategoryToSlug('')).toBe('outros')
  })
})

describe('pluggyAmountToCents', () => {
  it('DEBIT negativo, CREDIT positivo', () => {
    expect(pluggyAmountToCents(42.5, 'DEBIT')).toBe(-4250)
    expect(pluggyAmountToCents(100, 'CREDIT')).toBe(10000)
  })
})

describe('mapPluggyTransactionToDraft', () => {
  it('monta rascunho', () => {
    const d = mapPluggyTransactionToDraft({
      id: 'abc',
      description: 'Uber Trip',
      amount: 25.9,
      type: 'DEBIT',
      date: '2026-03-01T12:00:00.000Z',
      category: { description: 'Transport' },
    })
    expect(d.externalId).toBe('abc')
    expect(d.date).toBe('2026-03-01')
    expect(d.categorySlug).toBe('transporte')
    expect(d.cents).toBe(-2590)
  })
})
