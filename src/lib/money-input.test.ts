import { describe, expect, it } from 'vitest'
import { reais } from '@/domain/money'
import { centsToInput, digitsToCents, maskMoney } from './money-input'

describe('digitsToCents — máscara bancária', () => {
  it('preenche da direita para a esquerda', () => {
    expect(digitsToCents('1')).toBe(1) // R$ 0,01
    expect(digitsToCents('12')).toBe(12) // R$ 0,12
    expect(digitsToCents('123')).toBe(123) // R$ 1,23
    expect(digitsToCents('1234')).toBe(1234) // R$ 12,34
    expect(digitsToCents('123456')).toBe(123456) // R$ 1.234,56
  })
  it('ignora caracteres não numéricos', () => {
    expect(digitsToCents('R$ 1.234,56')).toBe(123456)
    expect(digitsToCents('abc')).toBe(0)
    expect(digitsToCents('')).toBe(0)
  })
})

describe('maskMoney', () => {
  it('formata em pt-BR sem símbolo', () => {
    expect(maskMoney('1234')).toBe('12,34')
    expect(maskMoney('123456')).toBe('1.234,56')
    expect(maskMoney('5')).toBe('0,05')
  })
})

describe('centsToInput', () => {
  it('preenche o input a partir de Cents', () => {
    expect(centsToInput(reais(1234.56))).toBe('1.234,56')
    expect(centsToInput(reais(10))).toBe('10,00')
  })
})
