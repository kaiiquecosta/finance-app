/**
 * Resolve fundamentos: Investidor10 (preferido) → Yahoo (fallback).
 * Usado pelo proxy `/api/market/fundamentals` e pelo plugin Vite em dev.
 */
import type { AssetKind, StockRegion } from './catalog/types'
import {
  buildFundamentalsFromInvestidor10,
  investidor10PageUrl,
} from './investidor10Fundamentals'
import {
  buildFundamentalMetrics,
  extractFundamentalRaw,
  fetchYahooFundamentalsRaw,
  type FundamentalMetric,
  type FundamentalsResponse,
  type FundamentalsSource,
} from './marketFundamentals'

export type { FundamentalsResponse, FundamentalsSource }

const UA = 'Mozilla/5.0 (compatible; FluxFinance/2.0)'

const VALID_KINDS = new Set<AssetKind>(['stock', 'fii', 'etf', 'bdr', 'crypto', 'index', 'commodity'])
const VALID_REGIONS = new Set<StockRegion>(['us', 'br', 'global'])

export function parseFundamentalsQuery(
  query: Record<string, string | string[] | undefined>,
): {
  symbol: string
  kind: AssetKind
  region: StockRegion
  currency: 'BRL' | 'USD'
} | null {
  const symbol = String(query.symbol ?? '').trim().toUpperCase()
  if (!symbol || symbol.length > 16 || !/^[A-Z0-9.\-=^]+$/.test(symbol)) return null

  const kindRaw = String(query.kind ?? 'stock').trim() as AssetKind
  const kind = VALID_KINDS.has(kindRaw) ? kindRaw : 'stock'

  const regionRaw = String(query.region ?? 'br').trim() as StockRegion
  const region = VALID_REGIONS.has(regionRaw) ? regionRaw : 'br'

  const currencyRaw = String(query.currency ?? 'BRL').trim().toUpperCase()
  const currency: 'BRL' | 'USD' = currencyRaw === 'USD' ? 'USD' : 'BRL'

  return { symbol, kind, region, currency }
}

async function fetchFromInvestidor10(
  symbol: string,
  kind: AssetKind,
  region: StockRegion,
): Promise<FundamentalMetric[] | null> {
  const url = investidor10PageUrl(symbol, kind, region)
  if (!url) return null
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    })
    if (!res.ok) return null
    const html = await res.text()
    const metrics = buildFundamentalsFromInvestidor10(html, kind)
    return metrics.length > 0 ? metrics : null
  } catch {
    return null
  }
}

export async function resolveAssetFundamentals(
  symbol: string,
  kind: AssetKind,
  region: StockRegion,
  currency: 'BRL' | 'USD',
): Promise<FundamentalsResponse> {
  const fromI10 = await fetchFromInvestidor10(symbol, kind, region)
  if (fromI10) return { metrics: fromI10, source: 'investidor10' }

  try {
    const raw = extractFundamentalRaw(await fetchYahooFundamentalsRaw(symbol))
    const metrics = buildFundamentalMetrics(raw, kind, currency)
    if (metrics.length > 0) return { metrics, source: 'yahoo' }
  } catch {
    /* Yahoo indisponível */
  }

  return { metrics: [], source: 'yahoo' }
}
