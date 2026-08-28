import { describe, expect, it } from 'vitest'
import { INVESTOR_CATEGORIES, INVESTOR_CATEGORY_GROUPS, sortCatalogRows } from './investorCategories'

describe('INVESTOR_CATEGORY_GROUPS', () => {
  it('cobre todas as categorias sem duplicar', () => {
    const ids = INVESTOR_CATEGORY_GROUPS.flatMap((g) => g.categories)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
    expect(unique.size).toBe(INVESTOR_CATEGORIES.length)
    for (const cat of INVESTOR_CATEGORIES) {
      expect(unique.has(cat.id)).toBe(true)
    }
  })

  it('separa Brasil, internacional e renda fixa', () => {
    const brasil = INVESTOR_CATEGORY_GROUPS.find((g) => g.id === 'brasil')
    const intl = INVESTOR_CATEGORY_GROUPS.find((g) => g.id === 'internacional')
    expect(brasil?.categories).toContain('acoes_br')
    expect(brasil?.categories).toContain('fiis')
    expect(intl?.categories).toContain('stocks_us')
    expect(intl?.categories).toContain('etfs_us')
  })
})

describe('sortCatalogRows', () => {
  it('ordena por volatilidade (|var%|)', () => {
    const rows = sortCatalogRows(
      [
        { def: { name: 'A' }, quote: { pctChange: 2, price: 10 } },
        { def: { name: 'B' }, quote: { pctChange: -5, price: 10 } },
        { def: { name: 'C' }, quote: { pctChange: 1, price: 10 } },
      ],
      'volatility_desc',
    )
    expect(rows.map((r) => r.def.name)).toEqual(['B', 'A', 'C'])
  })
})
