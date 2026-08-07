import { describe, expect, it } from 'vitest'
import { filterBankPresets, matchBankPreset, FEATURED_BANK_PRESETS, ALL_BANK_PRESETS } from './banks'

describe('banks', () => {
  it('filtra por nome e keyword', () => {
    const nubank = filterBankPresets('nubank')
    expect(nubank.some((b) => b.id === 'nubank')).toBe(true)
    const bb = filterBankPresets('bb')
    expect(bb.some((b) => b.id === 'bb')).toBe(true)
  })

  it('sem busca mostra só destaques', () => {
    const list = filterBankPresets('')
    expect(list.length).toBe(FEATURED_BANK_PRESETS.length)
    expect(list.every((b) => b.featured)).toBe(true)
    expect(list.some((b) => b.id === 'amex')).toBe(false)
    expect(list.some((b) => b.id === 'nubank')).toBe(true)
  })

  it('busca parcial american encontra AmEx', () => {
    const list = filterBankPresets('american')
    expect(list.some((b) => b.id === 'amex')).toBe(true)
  })

  it('busca inclui bancos internacionais', () => {
    const amex = filterBankPresets('american express')
    expect(amex[0]?.id).toBe('amex')
    const chase = filterBankPresets('chase')
    expect(chase.some((b) => b.id === 'chase')).toBe(true)
    expect(ALL_BANK_PRESETS.length).toBeGreaterThan(FEATURED_BANK_PRESETS.length)
  })

  it('casa conta salva com preset', () => {
    expect(matchBankPreset('Nubank — corrente')?.id).toBe('nubank')
    expect(matchBankPreset('Conta XP Invest')).toBeTruthy()
    expect(matchBankPreset('Cartão American Express')?.id).toBe('amex')
  })
})
