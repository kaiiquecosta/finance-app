import { describe, expect, it } from 'vitest'
import { formatDate, formatMonthYear, formatPhone, formatRelativeDate } from './format'

describe('formatRelativeDate', () => {
  // Datas construídas localmente para evitar fuso.
  const asOf = new Date(2026, 2, 10, 12, 0, 0)

  it('hoje', () => {
    expect(formatRelativeDate(new Date(2026, 2, 10, 9, 0, 0), asOf)).toBe('hoje')
  })
  it('ontem', () => {
    expect(formatRelativeDate(new Date(2026, 2, 9, 9, 0, 0), asOf)).toBe('ontem')
  })
  it('data antiga → dd/mês', () => {
    const out = formatRelativeDate(new Date(2026, 2, 1, 9, 0, 0), asOf)
    expect(out).not.toBe('hoje')
    expect(out).not.toBe('ontem')
    expect(out).toMatch(/\d/)
  })
})

describe('formatPhone', () => {
  it('formata progressivamente conforme digita', () => {
    expect(formatPhone('1')).toBe('1')
    expect(formatPhone('11')).toBe('11')
    expect(formatPhone('119')).toBe('(11) 9')
    expect(formatPhone('1191234')).toBe('(11) 91234')
    expect(formatPhone('11912345678')).toBe('(11) 91234-5678')
  })
  it('ignora não-dígitos e limita a 11 dígitos', () => {
    expect(formatPhone('(11) 91234-5678')).toBe('(11) 91234-5678')
    expect(formatPhone('119123456789999')).toBe('(11) 91234-5678')
  })
  it('vazio continua vazio', () => {
    expect(formatPhone('')).toBe('')
  })
})

describe('formatMonthYear / formatDate', () => {
  it('mês abreviado + ano', () => {
    expect(formatMonthYear(2, 2026)).toBe('Mar/2026')
  })
  it('data completa pt-BR', () => {
    expect(formatDate(new Date(2026, 2, 10))).toContain('2026')
  })
})
