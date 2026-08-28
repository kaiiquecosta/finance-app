import { describe, expect, it } from 'vitest'
import { searchInvestmentCatalog, catalogForInvestmentType } from './investmentCatalog'

describe('searchInvestmentCatalog', () => {
  it('sugere ITUB ao digitar itub', () => {
    const hits = searchInvestmentCatalog('acoes', 'itub')
    expect(hits.some((d) => d.symbol.includes('ITUB'))).toBe(true)
  })

  it('filtra FIIs separado de ações', () => {
    const fiiHits = searchInvestmentCatalog('fii', 'mxrf')
    expect(fiiHits.every((d) => d.kind === 'fii')).toBe(true)
    const stockHits = searchInvestmentCatalog('acoes', 'mxrf')
    expect(stockHits.every((d) => d.kind === 'stock')).toBe(true)
  })

  it('catálogo de cripto não inclui ações BR', () => {
    const pool = catalogForInvestmentType('cripto')
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((d) => d.kind === 'crypto')).toBe(true)
  })
})
