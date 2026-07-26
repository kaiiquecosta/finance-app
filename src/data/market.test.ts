import { describe, expect, it } from 'vitest'
import { parseBcbValue, parseQuotes } from './market'

describe('parseQuotes (AwesomeAPI)', () => {
  const sample = {
    USDBRL: { bid: '5.0785', pctChange: '0.5', timestamp: '1785099600' },
    BTCBRL: { bid: '332507', pctChange: '1.11', timestamp: '1785103668' },
    SOLBRL: { bid: '376.5', pctChange: '-3.313', timestamp: '1784904949' },
  }
  const quotes = parseQuotes(sample)

  it('normaliza preço, variação e timestamp', () => {
    const usd = quotes.find((q) => q.code === 'USD')
    expect(usd?.price).toBe(5.0785)
    expect(usd?.pctChange).toBe(0.5)
    expect(usd?.kind).toBe('currency')
    expect(usd?.updatedAt).toBe(1785099600 * 1000)
  })
  it('classifica cripto e mantém variação negativa', () => {
    const sol = quotes.find((q) => q.code === 'SOL')
    expect(sol?.kind).toBe('crypto')
    expect(sol?.pctChange).toBe(-3.313)
  })
  it('ignora pares ausentes', () => {
    expect(quotes.find((q) => q.code === 'EUR')).toBeUndefined()
    expect(quotes).toHaveLength(3)
  })
})

describe('parseBcbValue (SGS)', () => {
  it('extrai o valor da última observação', () => {
    expect(parseBcbValue([{ data: '23/07/2026', valor: '14.15' }])).toBe(14.15)
  })
  it('aceita vírgula decimal', () => {
    expect(parseBcbValue([{ data: '01/06/2026', valor: '4,64' }])).toBe(4.64)
  })
  it('retorna null para vazio/ inválido', () => {
    expect(parseBcbValue([])).toBeNull()
    expect(parseBcbValue(null)).toBeNull()
    expect(parseBcbValue([{ data: 'x' }])).toBeNull()
  })
})
