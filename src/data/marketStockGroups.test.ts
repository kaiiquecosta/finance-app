import { describe, expect, it } from 'vitest'
import { buildMarketCryptoGroups, buildMarketStockCategory, buildMarketStockGroups, marketStockFilterSymbols } from './marketStockGroups'
import type { StockQuote } from './marketSpark'

function quote(yahoo: string, symbol: string, kind: 'stock' | 'fii' | 'crypto' = 'stock'): StockQuote {
  return {
    yahoo,
    symbol,
    name: symbol,
    exchange: kind === 'fii' ? 'B3' : kind === 'crypto' ? 'Cripto' : 'B3',
    region: kind === 'crypto' ? 'global' : 'br',
    icon: '📈',
    currency: kind === 'crypto' ? 'USD' : 'BRL',
    price: 10,
    pctChange: -1,
    sparkline: [],
    updatedAt: Date.now(),
  }
}

describe('buildMarketStockGroups', () => {
  it('separa ações BR, FIIs e cripto em grupos distintos', () => {
    const groups = buildMarketStockGroups([
      quote('ITUB4.SA', 'ITUB4'),
      quote('MXRF11.SA', 'MXRF11', 'fii'),
      quote('BTC-USD', 'BTC', 'crypto'),
      quote('AAPL', 'AAPL'),
    ])

    const labels = groups.map((g) => g.label)
    expect(labels).toContain('Brasil · B3')
    expect(labels).toContain('Internacional')

    const br = groups.find((g) => g.id === 'brasil')
    expect(br?.categories.some((c) => c.id === 'acoes_br')).toBe(true)
    expect(br?.categories.some((c) => c.id === 'fiis')).toBe(true)
    expect(br?.categories.some((c) => c.id === 'crypto')).toBe(false)
  })

  it('subdivide ações BR por setor', () => {
    const groups = buildMarketStockGroups([quote('ITUB4.SA', 'ITUB4')])
    const acoes = groups.flatMap((g) => g.categories).find((c) => c.id === 'acoes_br')
    expect(acoes?.hasSectors).toBe(true)
    expect(acoes?.sectors.some((s) => s.label === 'Financeiro')).toBe(true)
  })
})

describe('buildMarketStockCategory', () => {
  it('monta uma categoria filtrada', () => {
    const cat = buildMarketStockCategory([quote('ITUB4.SA', 'ITUB4')], 'acoes_br')
    expect(cat?.id).toBe('acoes_br')
    expect(cat?.sectors.some((s) => s.label === 'Financeiro')).toBe(true)
  })
})

describe('marketStockFilterSymbols', () => {
  it('retorna só símbolos da categoria', () => {
    const syms = marketStockFilterSymbols('fiis')
    expect(syms.every((s) => s.endsWith('.SA'))).toBe(true)
    expect(syms.some((s) => s.includes('MXRF'))).toBe(true)
    expect(syms.some((s) => s.includes('AAPL'))).toBe(false)
  })
})

describe('buildMarketCryptoGroups', () => {
  it('separa principais de altcoins', () => {
    const sections = buildMarketCryptoGroups([
      quote('BTC-USD', 'BTC', 'crypto'),
      quote('SOL-USD', 'SOL', 'crypto'),
    ])
    expect(sections[0]?.label).toBe('Principais')
    expect(sections[1]?.label).toBe('Altcoins')
  })
})
