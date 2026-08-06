import { describe, expect, it } from 'vitest'
import { filterBankPresets, matchBankPreset } from './banks'

describe('banks', () => {
  it('filtra por nome e keyword', () => {
    const nubank = filterBankPresets('nubank')
    expect(nubank.some((b) => b.id === 'nubank')).toBe(true)
    const bb = filterBankPresets('bb')
    expect(bb.some((b) => b.id === 'bb')).toBe(true)
  })

  it('casa conta salva com preset', () => {
    expect(matchBankPreset('Nubank — corrente')?.id).toBe('nubank')
    expect(matchBankPreset('Conta XP Invest')).toBeTruthy()
  })
})
