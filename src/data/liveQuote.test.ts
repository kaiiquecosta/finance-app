import { describe, expect, it } from 'vitest'
import { applyLiveQuoteToStats, mergeLiveQuoteIntoChart } from './liveQuote'
import type { AssetStats, ChartSeries } from './marketChart'

const baseStats: AssetStats = {
  price: 77,
  previousClose: 79,
  dayChangePct: -2.53,
  dayHigh: 79.5,
  dayLow: 76.8,
  high52w: 91.62,
  low52w: 54.81,
  fromHigh52wPct: -15.96,
  volume: 9_900_000,
  volatilityPct: 26.11,
}

describe('applyLiveQuoteToStats', () => {
  it('recalcula variação do dia e expande mín/máx', () => {
    const next = applyLiveQuoteToStats(baseStats, 80.2)
    expect(next.price).toBe(80.2)
    expect(next.dayChangePct).toBeCloseTo(((80.2 - 79) / 79) * 100, 2)
    expect(next.dayHigh).toBe(80.2)
    expect(next.dayLow).toBe(76.8)
  })
})

describe('mergeLiveQuoteIntoChart', () => {
  const series: ChartSeries = {
    meta: { symbol: 'VALE3.SA', currency: 'BRL' },
    timestamps: [1_000, 1_300],
    closes: [78, 77.5],
    volumes: [100, 120],
  }

  it('substitui o último close quando ainda no mesmo intervalo', () => {
    const merged = mergeLiveQuoteIntoChart(series, 77.93, 1_320_000)
    expect(merged.closes).toEqual([78, 77.93])
    expect(merged.timestamps).toEqual([1_000, 1_300])
  })

  it('acrescenta ponto quando passou o intervalo de 5 min', () => {
    const merged = mergeLiveQuoteIntoChart(series, 77.1, 1_600_000)
    expect(merged.closes).toEqual([78, 77.5, 77.1])
    expect(merged.timestamps).toEqual([1_000, 1_300, 1_600])
  })
})
