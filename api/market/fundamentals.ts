import { parseFundamentalsQuery, resolveAssetFundamentals } from '../_lib/fundamentalsServer.js'

export default async function handler(
  req: { method?: string; query?: Record<string, string | string[] | undefined> },
  res: {
    status: (code: number) => { json: (body: unknown) => void; end?: (body: string) => void }
    setHeader: (key: string, value: string) => void
  },
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsed = parseFundamentalsQuery(req.query ?? {})
  if (!parsed) {
    res.status(400).json({ error: 'invalid query' })
    return
  }

  try {
    const body = await resolveAssetFundamentals(
      parsed.symbol,
      parsed.kind,
      parsed.region,
      parsed.currency,
    )
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
    res.status(200).json(body)
  } catch (err) {
    console.error('fundamentals error', err)
    res.status(502).json({ error: 'fetch_failed' })
  }
}
