import type { Plugin } from 'vite'
import { fetchYahooSparkRaw } from './src/data/marketSpark'
import { fetchYahooChartRaw } from './src/data/marketChart'
import { parseFundamentalsQuery, resolveAssetFundamentals } from './src/data/fundamentalsResolve'

/** Proxies locais `/api/market/*` → Yahoo (dev); produção usa as functions em `api/` na Vercel. */
export function marketSparkDevPlugin(): Plugin {
  return {
    name: 'market-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/market/spark', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const symbols = (url.searchParams.get('symbols') ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 60)
          if (!symbols.length) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'symbols required' }))
            return
          }
          const data = await fetchYahooSparkRaw(symbols)
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(data))
        } catch {
          res.statusCode = 502
          res.end(JSON.stringify({ error: 'fetch_failed' }))
        }
      })

      server.middlewares.use('/api/market/chart', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const symbol = (url.searchParams.get('symbol') ?? '').trim().toUpperCase()
          const range = url.searchParams.get('range')
          const interval = url.searchParams.get('interval') ?? '1d'
          const period1 = url.searchParams.get('period1')
          const period2 = url.searchParams.get('period2')
          if (!symbol) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'symbol required' }))
            return
          }
          const data = await fetchYahooChartRaw(
            symbol,
            period1 && period2
              ? { interval, period1: Number(period1), period2: Number(period2) }
              : { range: range ?? '1mo', interval },
          )
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(data))
        } catch {
          res.statusCode = 502
          res.end(JSON.stringify({ error: 'fetch_failed' }))
        }
      })

      server.middlewares.use('/api/market/fundamentals', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const query: Record<string, string> = {}
          url.searchParams.forEach((v, k) => {
            query[k] = v
          })
          const parsed = parseFundamentalsQuery(query)
          if (!parsed) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'invalid query' }))
            return
          }
          const data = await resolveAssetFundamentals(
            parsed.symbol,
            parsed.kind,
            parsed.region,
            parsed.currency,
          )
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(data))
        } catch {
          res.statusCode = 502
          res.end(JSON.stringify({ error: 'fetch_failed' }))
        }
      })
    },
  }
}
