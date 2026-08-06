const YAHOO = 'https://query2.finance.yahoo.com/v8/finance/spark'
const UA = 'Mozilla/5.0 (compatible; FluxFinance/2.0)'

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

  const raw = String(req.query.symbols ?? '')
  const symbols = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 60)

  if (symbols.length === 0) {
    res.status(400).json({ error: 'symbols required' })
    return
  }

  try {
    const q = new URLSearchParams({ symbols: symbols.join(','), range: '1d', interval: '5m' })
    const upstream = await fetch(`${YAHOO}?${q.toString()}`, { headers: { 'User-Agent': UA } })
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'upstream_failed' })
      return
    }
    const body = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=25, stale-while-revalidate=120')
    res.status(200).json(body)
  } catch {
    res.status(502).json({ error: 'fetch_failed' })
  }
}
