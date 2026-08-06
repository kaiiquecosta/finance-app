import { describe, expect, it } from 'vitest'
import { normalizeSearchTicker } from '@/data/catalog/helpers'
import { ALL_STOCKS, BR_FIIS, resolveSearchSymbol } from '@/data/stocksCatalog'

describe('normalizeSearchTicker', () => {
  it('corrige MXFR11 para MXRF11', () => {
    expect(normalizeSearchTicker('mxfr11')).toBe('MXRF11')
  })
})

describe('FIIs catalog', () => {
  it('inclui MXRF11 Maxi Renda', () => {
    const mx = BR_FIIS.find((f) => f.symbol === 'MXRF11')
    expect(mx?.name).toContain('Maxi')
  })

  it('tem dezenas de FIIs como no ranking público', () => {
    expect(BR_FIIS.length).toBeGreaterThanOrEqual(60)
    expect(ALL_STOCKS.length).toBeGreaterThan(150)
  })
})

describe('resolveSearchSymbol', () => {
  it('resolve MXFR11 via alias', () => {
    expect(resolveSearchSymbol('mxfr11')).toBe('MXRF11.SA')
  })
})
