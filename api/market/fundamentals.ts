import {
  parseFundamentalsQuery,
  resolveAssetFundamentals,
} from '../../src/data/fundamentalsResolve.js'

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

  const parsed = parseFundamentalsQuery(req.query ?? {})
  if (!parsed) {
    res.status(400).json({ error: 'invalid query' })
    return
  }

  try {
    const body = await resolveAssetFundamentals(parsed.symbol, parsed.kind, parsed.region, parsed.currency)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
    res.status(200).json(body)
  } catch {
    res.status(502).json({ error: 'fetch_failed' })
  }
}
