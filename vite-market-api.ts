import type { Plugin } from 'vite'
import { fetchYahooSparkRaw } from './src/data/marketSpark'

const UA = 'Mozilla/5.0 (compatible; FluxFinance/2.0)'

/** Proxy local `/api/market/spark` → Yahoo (dev); produção usa `api/market/spark.ts` na Vercel. */
export function marketSparkDevPlugin(): Plugin {
  return {
    name: 'market-spark-dev',
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
            .slice(0, 40)
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
    },
  }
}

export { UA }
