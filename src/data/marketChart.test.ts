import { describe, expect, it } from 'vitest'
import { assetStats, parseYahooChart, periodReturns } from './marketChart'

const DAY = 86_400

function mkSeries(days: number, startPrice: number, endPrice: number) {
  const now = Math.floor(Date.now() / 1000)
  const timestamps: number[] = []
  const closes: number[] = []
  for (let i = days; i >= 0; i--) {
    timestamps.push(now - i * DAY)
    closes.push(startPrice + ((days - i) / days) * (endPrice - startPrice))
  }
  return { timestamps, closes }
}

describe('parseYahooChart', () => {
  it('normaliza payload e remove pontos nulos', () => {
    const json = {
      chart: {
        result: [
          {
            meta: { symbol: 'AAPL', currency: 'USD', regularMarketPrice: 102 },
            timestamp: [1, 2, 3, 4],
            indicators: { quote: [{ close: [100, null, 101, 102], volume: [10, null, 20, 30] }] },
          },
        ],
      },
    }
    const s = parseYahooChart(json)
    expect(s).not.toBeNull()
    expect(s!.closes).toEqual([100, 101, 102])
    expect(s!.timestamps).toEqual([1, 3, 4])
    expect(s!.volumes).toEqual([10, 20, 30])
  })

  it('retorna null sem result/meta', () => {
    expect(parseYahooChart({})).toBeNull()
    expect(parseYahooChart({ chart: { result: [] } })).toBeNull()
  })
})

describe('periodReturns', () => {
  it('calcula retorno de 12 meses numa série de 1 ano', () => {
    const { timestamps, closes } = mkSeries(365, 100, 150)
    const rets = periodReturns(timestamps, closes)
    const y = rets.find((r) => r.label === '12 meses')
    expect(y?.pct).toBeCloseTo(50, 0)
    const w = rets.find((r) => r.label === '1 sem')
    expect(w?.pct).not.toBeNull()
  })

  it('retorna null quando a série não cobre a janela', () => {
    const { timestamps, closes } = mkSeries(10, 100, 110)
    const rets = periodReturns(timestamps, closes)
    expect(rets.find((r) => r.label === '12 meses')?.pct).toBeNull()
  })
})

describe('assetStats', () => {
  it('usa meta quando disponível e calcula derivados', () => {
    const { timestamps, closes } = mkSeries(365, 100, 120)
    const s = assetStats({
      meta: {
        symbol: 'X',
        currency: 'BRL',
        regularMarketPrice: 120,
        chartPreviousClose: 118,
        fiftyTwoWeekHigh: 130,
        fiftyTwoWeekLow: 95,
        regularMarketVolume: 1_000_000,
      },
      timestamps,
      closes,
      volumes: closes.map(() => 500),
    })
    expect(s.price).toBe(120)
    expect(s.dayChangePct).toBeCloseTo(((120 - 118) / 118) * 100, 5)
    expect(s.high52w).toBe(130)
    expect(s.fromHigh52wPct).toBeCloseTo(((120 - 130) / 130) * 100, 5)
    expect(s.volume).toBe(1_000_000)
    expect(s.volatilityPct).not.toBeNull()
  })

  it('cai para a série quando meta traz zeros (ranges longos do Yahoo)', () => {
    const { timestamps, closes } = mkSeries(365, 100, 120)
    const s = assetStats({
      meta: { symbol: 'X', currency: 'BRL', fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0, regularMarketVolume: 0 },
      timestamps,
      closes,
      volumes: closes.map(() => 700),
    })
    expect(s.high52w).toBeCloseTo(120, 5)
    expect(s.low52w).toBeCloseTo(100, 5)
    expect(s.volume).toBe(700)
  })
})
