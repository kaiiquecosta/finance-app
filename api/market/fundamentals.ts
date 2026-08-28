const YAHOO = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary/'
const UA = 'Mozilla/5.0 (compatible; FluxFinance/2.0)'
const MODULES = 'summaryDetail,defaultKeyStatistics,financialData,price'

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
  if (!symbol || symbol.length > 16 || !/^[A-Z0-9.\-=^]+$/.test(symbol)) {
    res.status(400).json({ error: 'invalid symbol' })
    return
  }

  try {
    const q = new URLSearchParams({ modules: MODULES })
    const upstream = await fetch(`${YAHOO}${encodeURIComponent(symbol)}?${q.toString()}`, {
      headers: { 'User-Agent': UA },
    })
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'upstream_failed' })
      return
    }
    const body = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
    res.status(200).json(body)
  } catch {
    res.status(502).json({ error: 'fetch_failed' })
  }
}
