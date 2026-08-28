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
  const range = String(req.query?.range ?? '')
  const interval = String(req.query?.interval ?? '1d')
  const period1Raw = req.query?.period1
  const period2Raw = req.query?.period2
  const period1 = period1Raw != null ? Number(period1Raw) : NaN
  const period2 = period2Raw != null ? Number(period2Raw) : NaN
  const usePeriod = Number.isFinite(period1) && Number.isFinite(period2) && period1 >= 0 && period2 > period1

  if (!symbol || symbol.length > 16 || !/^[A-Z0-9.\-=^]+$/.test(symbol)) {
    res.status(400).json({ error: 'invalid symbol' })
    return
  }
  if (!INTERVALS.has(interval)) {
    res.status(400).json({ error: 'invalid interval' })
    return
  }
  if (!usePeriod && (!range || !RANGES.has(range))) {
    res.status(400).json({ error: 'invalid range/interval' })
    return
  }

  try {
    const q = new URLSearchParams({ interval })
    if (usePeriod) {
      q.set('period1', String(Math.floor(period1)))
      q.set('period2', String(Math.floor(period2)))
    } else {
      q.set('range', range || '1mo')
    }
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
