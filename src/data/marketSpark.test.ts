import { describe, expect, it, vi, afterEach } from 'vitest'
import { ALL_STOCKS } from './stocksCatalog'
import { fetchStockQuotes, parseYahooSparkPayload, SPARK_BATCH_SIZE } from './marketSpark'

describe('fetchStockQuotes batching', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('divide símbolos em lotes dentro do limite do Yahoo', async () => {
    const symbols = ALL_STOCKS.map((s) => s.yahoo)
    expect(symbols.length).toBeGreaterThan(SPARK_BATCH_SIZE)
    const calls: string[] = []

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const u = new URL(url, 'https://flux.test')
        calls.push(u.searchParams.get('symbols') ?? '')
        const syms = (u.searchParams.get('symbols') ?? '').split(',')
        const body: Record<string, { close: number[]; previousClose: number }> = {}
        for (const s of syms) {
          body[s] = { close: [10, 11], previousClose: 10 }
        }
        return new Response(JSON.stringify(body), { status: 200 })
      }),
    )

    const quotes = await fetchStockQuotes(symbols)
    expect(calls.length).toBeGreaterThan(1)
    expect(calls.every((c) => c.split(',').length <= SPARK_BATCH_SIZE)).toBe(true)
    expect(quotes.length).toBe(symbols.length)
  })

  it('falha só se todos os lotes falharem', async () => {
    const symbols = ALL_STOCKS.map((s) => s.yahoo).slice(0, SPARK_BATCH_SIZE + 5)
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        call++
        if (call === 1) return new Response(JSON.stringify({ error: 'x' }), { status: 502 })
        const body: Record<string, { close: number[]; previousClose: number }> = {}
        for (const s of symbols.slice(SPARK_BATCH_SIZE)) {
          body[s] = { close: [1], previousClose: 1 }
        }
        return new Response(JSON.stringify(body), { status: 200 })
      }),
    )

    const q = await fetchStockQuotes(symbols)
    expect(q.length).toBeGreaterThan(0)
  })
})

describe('parseYahooSparkPayload', () => {
  it('calcula preço e variação % a partir do spark', () => {
    const data = {
      AAPL: {
        close: [100, 101, 102],
        previousClose: 100,
        timestamp: [1, 2, 3],
      },
    }
    const q = parseYahooSparkPayload(data, [
      {
        yahoo: 'AAPL',
        symbol: 'AAPL',
        name: 'Apple',
        exchange: 'NASDAQ',
        region: 'us',
        kind: 'stock',
        icon: '🍎',
        currency: 'USD',
      },
    ])
    expect(q).toHaveLength(1)
    expect(q[0].price).toBe(102)
    expect(q[0].pctChange).toBeCloseTo(2, 5)
  })
})
