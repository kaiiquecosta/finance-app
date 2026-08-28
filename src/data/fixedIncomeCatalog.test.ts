import { describe, expect, it } from 'vitest'
import { searchFixedIncomeCatalog, supportsFixedIncomeAutocomplete } from './fixedIncomeCatalog'

describe('searchFixedIncomeCatalog', () => {
  it('sugere LCI ao digitar lci', () => {
    const hits = searchFixedIncomeCatalog('lci', 'lci itau')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((h) => h.name.toLowerCase().includes('lci'))).toBe(true)
  })

  it('sugere CDB por banco', () => {
    const hits = searchFixedIncomeCatalog('cdb', 'nubank')
    expect(hits.some((h) => h.bank === 'Nubank')).toBe(true)
  })

  it('filtra Tesouro Selic', () => {
    const hits = searchFixedIncomeCatalog('selic', '2029')
    expect(hits.every((h) => h.name.toLowerCase().includes('tesouro'))).toBe(true)
  })

  it('habilita autocomplete em renda fixa', () => {
    expect(supportsFixedIncomeAutocomplete('lci')).toBe(true)
    expect(supportsFixedIncomeAutocomplete('cdb')).toBe(true)
    expect(supportsFixedIncomeAutocomplete('acoes')).toBe(false)
  })
})
