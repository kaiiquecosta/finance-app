import { describe, expect, it } from 'vitest'
import { INVESTOR_CATEGORIES, INVESTOR_CATEGORY_GROUPS } from './investorCategories'

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
