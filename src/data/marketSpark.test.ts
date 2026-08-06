import { describe, expect, it } from 'vitest'
import { parseYahooSparkPayload } from './marketSpark'
import { US_STOCKS } from './stocksCatalog'

describe('parseYahooSparkPayload', () => {
  it('calcula preço e variação % a partir do spark', () => {
    const data = {
      AAPL: {
        close: [100, 101, 102],
        previousClose: 100,
        timestamp: [1, 2, 3],
      },
    }
    const q = parseYahooSparkPayload(data, [US_STOCKS[0]])
    expect(q).toHaveLength(1)
    expect(q[0].symbol).toBe('AAPL')
    expect(q[0].price).toBe(102)
    expect(q[0].pctChange).toBeCloseTo(2, 5)
    expect(q[0].sparkline).toEqual([100, 101, 102])
  })

  it('ignora símbolos sem close', () => {
    expect(parseYahooSparkPayload({ X: { close: [] } }, US_STOCKS)).toHaveLength(0)
  })
})
