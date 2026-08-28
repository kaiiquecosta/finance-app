import { describe, expect, it } from 'vitest'
import { historicalPriceFromSeries, sharesFromAmount } from './marketHistorical'
import type { ChartSeries } from './marketChart'

describe('historicalPriceFromSeries', () => {
  const series: ChartSeries = {
    meta: { symbol: 'ITUB4.SA', currency: 'BRL' },
    timestamps: [
      Math.floor(new Date('2025-01-02T00:00:00').getTime() / 1000),
      Math.floor(new Date('2025-01-03T00:00:00').getTime() / 1000),
    ],
    closes: [30, 32],
    volumes: [1000, 1100],
  }

  it('usa fechamento no dia', () => {
    const r = historicalPriceFromSeries(series, '2025-01-03')
    expect(r?.price).toBe(32)
    expect(r?.tradeDate).toBe('2025-01-03')
  })

  it('usa último pregão anterior em fim de semana', () => {
    const r = historicalPriceFromSeries(series, '2025-01-04')
    expect(r?.price).toBe(32)
    expect(r?.tradeDate).toBe('2025-01-03')
  })
})

describe('sharesFromAmount', () => {
  it('calcula quantidade a partir do valor e preço', () => {
    expect(sharesFromAmount(1000, 32)).toBeCloseTo(31.25, 4)
  })
})
