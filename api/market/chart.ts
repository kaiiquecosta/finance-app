const YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart/'
const UA = 'Mozilla/5.0 (compatible; FluxFinance/2.0)'

const RANGES = new Set(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'])
const INTERVALS = new Set(['1m', '2m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo'])

export default async function handler(
  req: { method?: string; query?: Record<string, string | string[] | undefined> },
  res: {
    status: (code: number) => { json: (body: unknown) => void }
    setHeader: (key: string, value: string) => void
  },
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const symbol = String(req.query?.symbol ?? '').trim().toUpperCase()
  const range = String(req.query?.range ?? '1mo')
  const interval = String(req.query?.interval ?? '1d')

  if (!symbol || symbol.length > 16 || !/^[A-Z0-9.\-=^]+$/.test(symbol)) {
    res.status(400).json({ error: 'invalid symbol' })
    return
  }
  if (!RANGES.has(range) || !INTERVALS.has(interval)) {
    res.status(400).json({ error: 'invalid range/interval' })
    return
  }

  try {
    const q = new URLSearchParams({ range, interval })
    const upstream = await fetch(`${YAHOO}${encodeURIComponent(symbol)}?${q.toString()}`, {
      headers: { 'User-Agent': UA },
    })
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'upstream_failed' })
      return
    }
    const body = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300')
    res.status(200).json(body)
  } catch {
    res.status(502).json({ error: 'fetch_failed' })
  }
}
