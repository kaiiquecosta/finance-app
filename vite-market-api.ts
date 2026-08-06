import type { Plugin } from 'vite'
import { fetchYahooSparkRaw } from './src/data/marketSpark'
import { fetchYahooChartRaw } from './src/data/marketChart'

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
          const range = url.searchParams.get('range') ?? '1mo'
          const interval = url.searchParams.get('interval') ?? '1d'
          if (!symbol) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'symbol required' }))
            return
          }
          const data = await fetchYahooChartRaw(symbol, range, interval)
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
