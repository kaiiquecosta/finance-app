import { describe, expect, it } from 'vitest'
import { addMonths, daysBetween, parseISODate, toISODate } from './dates'

describe('parseISODate', () => {
  it('trata "YYYY-MM-DD" como data local (dia estável, sem fuso)', () => {
    const d = parseISODate('2026-03-10')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(2) // março
    expect(d.getDate()).toBe(10)
  })
})

describe('daysBetween', () => {
  it('conta dias de calendário', () => {
    expect(daysBetween('2025-01-01', '2026-01-01')).toBe(365) // 2025 não bissexto
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0)
    expect(daysBetween('2026-02-01', '2026-01-01')).toBe(-31)
  })
  it('aceita Date no segundo argumento', () => {
    expect(daysBetween('2026-01-01', new Date(2026, 0, 11))).toBe(10)
  })
})

describe('toISODate', () => {
  it('formata local com zero à esquerda', () => {
    expect(toISODate(new Date(2026, 2, 5))).toBe('2026-03-05')
  })
})

describe('addMonths', () => {
  it('normaliza para frente e para trás', () => {
    expect(addMonths(11, 2025, 1)).toEqual({ month: 0, year: 2026 })
    expect(addMonths(0, 2026, -1)).toEqual({ month: 11, year: 2025 })
    expect(addMonths(2, 2026, 10)).toEqual({ month: 0, year: 2027 })
  })
})
