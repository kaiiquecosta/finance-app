import { describe, expect, it } from 'vitest'
import { buildFundamentalMetrics, extractFundamentalRaw } from './marketFundamentals'

const sample = {
  quoteSummary: {
    result: [
      {
        summaryDetail: {
          dividendYield: { raw: 0.082 },
          trailingAnnualDividendRate: { raw: 6.4 },
          trailingPE: { raw: 8.5 },
          forwardPE: { raw: 7.9 },
          marketCap: { raw: 350_000_000_000 },
          beta: { raw: 0.95 },
        },
        defaultKeyStatistics: {
          priceToBook: { raw: 1.12 },
          trailingEps: { raw: 9.17 },
          bookValue: { raw: 69.5 },
          returnOnEquity: { raw: 0.18 },
          profitMargins: { raw: 0.32 },
          payoutRatio: { raw: 0.55 },
        },
        financialData: {
          returnOnEquity: { raw: 0.18 },
          debtToEquity: { raw: 42.5 },
          revenueGrowth: { raw: 0.04 },
        },
      },
    ],
  },
}

describe('extractFundamentalRaw', () => {
  it('extrai DY, P/VP e P/L', () => {
    const raw = extractFundamentalRaw(sample)
    expect(raw?.dividendYield).toBeCloseTo(0.082)
    expect(raw?.priceToBook).toBeCloseTo(1.12)
    expect(raw?.trailingPe).toBeCloseTo(8.5)
  })
})

describe('buildFundamentalMetrics', () => {
  it('monta métricas para FII/ação com labels BR', () => {
    const raw = extractFundamentalRaw(sample)
    const metrics = buildFundamentalMetrics(raw, 'fii', 'BRL')
    const labels = metrics.map((m) => m.label)
    expect(labels).toContain('Dividend yield (DY)')
    expect(labels).toContain('P/VP')
    expect(labels).toContain('P/L')
    expect(metrics.find((m) => m.id === 'dy')?.value).toBe('8,20%')
  })
})
