import { describe, expect, it } from 'vitest'
import * as M from './money'

describe('Money — conversão', () => {
  it('reais → centavos', () => {
    expect(M.reais(1234.56)).toBe(123456)
    expect(M.reais(0)).toBe(0)
    expect(M.reais(-5)).toBe(-500)
  })

  it('evita erro de float (0.1 + 0.2)', () => {
    // 0.1 + 0.2 = 0.30000000000000004 em float; em centavos deve ser exato.
    expect(M.reais(0.1 + 0.2)).toBe(30)
    const soma = M.add(M.reais(0.1), M.reais(0.2))
    expect(soma).toBe(30)
    expect(M.toReais(soma)).toBe(0.3)
  })

  it('cents e toReais são inversos', () => {
    expect(M.cents(123456)).toBe(123456)
    expect(M.toReais(M.reais(99.99))).toBe(99.99)
  })

  it('rejeita valores não-finitos', () => {
    expect(() => M.reais(NaN)).toThrow(RangeError)
    expect(() => M.reais(Infinity)).toThrow(RangeError)
  })
})

describe('Money — aritmética', () => {
  it('add / sub / neg / abs', () => {
    expect(M.add(M.reais(10), M.reais(5))).toBe(1500)
    expect(M.sub(M.reais(10), M.reais(5))).toBe(500)
    expect(M.neg(M.reais(10))).toBe(-1000)
    expect(M.abs(M.reais(-10))).toBe(1000)
  })

  it('sum de lista', () => {
    expect(M.sum([M.reais(1.5), M.reais(2.5), M.reais(6)])).toBe(1000)
    expect(M.sum([])).toBe(0)
  })

  it('mul por escalar arredonda ao centavo', () => {
    expect(M.mul(M.reais(10), 3)).toBe(3000)
    // 33,33 * 3 tem que dar 99,99 (e não 100)
    expect(M.mul(M.reais(33.33), 3)).toBe(9999)
  })

  it('rate aplica fração e arredonda', () => {
    expect(M.rate(M.reais(100), 0.15)).toBe(1500)
    expect(M.rate(M.reais(10), 0.225)).toBe(225)
  })

  it('allocate divide sem perder centavos', () => {
    const parts = M.allocate(M.reais(100), 3)
    expect(parts).toEqual([3334, 3333, 3333])
    expect(M.sum(parts)).toBe(M.reais(100))
  })

  it('allocate lida com negativos', () => {
    const parts = M.allocate(M.reais(-1), 3)
    expect(M.sum(parts)).toBe(-100)
  })

  it('percentOf é seguro para whole = 0', () => {
    expect(M.percentOf(M.reais(25), M.reais(100))).toBe(25)
    expect(M.percentOf(M.reais(25), M.ZERO)).toBe(0)
  })

  it('clamp / min / max', () => {
    expect(M.clamp(M.reais(150), M.ZERO, M.reais(100))).toBe(10000)
    expect(M.max(M.reais(1), M.reais(2))).toBe(200)
    expect(M.min(M.reais(1), M.reais(2))).toBe(100)
  })
})

describe('Money — parseBRL', () => {
  it('formato BR com decimais', () => {
    expect(M.parseBRL('3.000,50')).toBe(300050)
    expect(M.parseBRL('3000,50')).toBe(300050)
    expect(M.parseBRL('1.234.567,89')).toBe(123456789)
  })

  it('formato US e ponto decimal', () => {
    expect(M.parseBRL('3000.50')).toBe(300050)
    expect(M.parseBRL('3,000.50')).toBe(300050)
  })

  it('milhares BR sem decimal', () => {
    expect(M.parseBRL('3.000')).toBe(300000)
    expect(M.parseBRL('1.234.567')).toBe(123456700)
  })

  it('com símbolo, espaços e sinal', () => {
    expect(M.parseBRL('R$ 1.234,56')).toBe(123456)
    expect(M.parseBRL('-50,00')).toBe(-5000)
    expect(M.parseBRL('  10  ')).toBe(1000)
  })

  it('inteiros e número', () => {
    expect(M.parseBRL('1234')).toBe(123400)
    expect(M.parseBRL(1234.56)).toBe(123456)
  })

  it('entradas vazias/inválidas → 0', () => {
    expect(M.parseBRL('')).toBe(0)
    expect(M.parseBRL('abc')).toBe(0)
  })
})

describe('Money — formatBRL', () => {
  it('formata positivo, negativo e zero', () => {
    expect(M.formatBRL(M.reais(1234.56))).toContain('1.234,56')
    expect(M.formatBRL(M.reais(1234.56))).toContain('R$')
    const neg = M.formatBRL(M.cents(-500))
    expect(neg.startsWith('-')).toBe(true)
    expect(neg).toContain('5,00')
    expect(M.formatBRL(M.ZERO)).toContain('0,00')
  })

  it('opção sign prefixa "+" em positivos', () => {
    expect(M.formatBRL(M.reais(5), { sign: true }).startsWith('+')).toBe(true)
    expect(M.formatBRL(M.ZERO, { sign: true }).startsWith('+')).toBe(false)
  })
})
