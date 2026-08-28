import { describe, expect, it } from 'vitest'
import {
  buildFundamentalsFromInvestidor10,
  investidor10PagePath,
  parseInvestidor10Indicators,
  pickKeyFundamentals,
} from './investidor10Fundamentals'

const snippet = `
  data-indicator="P/L"
  data-current-value="8.48"
  data-indicator="P/VP"
  data-current-value="7.16"
  data-indicator="Dividend Yield"
  data-current-value="11.49"
  data-indicator="ROE"
  data-current-value="73.78"
`

describe('investidor10Fundamentals', () => {
  it('resolve caminho de ações BR', () => {
    expect(investidor10PagePath('BBSE3.SA', 'stock', 'br')).toBe('/acoes/bbse3/')
    expect(investidor10PagePath('MXRF11', 'fii', 'br')).toBe('/fiis/mxrf11/')
  })

  it('parseia P/L, P/VP e DY', () => {
    const map = parseInvestidor10Indicators(snippet)
    expect(map.get('P/L')).toBe(8.48)
    expect(map.get('P/VP')).toBe(7.16)
    expect(map.get('Dividend Yield')).toBe(11.49)
  })

  it('monta métricas e destaque', () => {
    const metrics = buildFundamentalsFromInvestidor10(snippet, 'stock')
    const keys = pickKeyFundamentals(metrics)
    expect(keys.pl).toBe('8,48')
    expect(keys.pvp).toBe('7,16')
    expect(keys.dy).toBe('11,49%')
  })
})
