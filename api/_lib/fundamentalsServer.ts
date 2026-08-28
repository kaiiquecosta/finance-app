/**
 * Fundamentos via Investidor10 — módulo server-side (Vercel + Vite dev).
 * Sem imports de src/ (evita FUNCTION_INVOCATION_FAILED na Vercel).
 */

export type AssetKind = 'stock' | 'fii' | 'etf' | 'crypto' | 'bdr' | 'index' | 'commodity'
export type StockRegion = 'us' | 'br' | 'global'

export interface FundamentalMetric {
  id: string
  label: string
  value: string
  hint?: string
}

export type FundamentalsSource = 'investidor10' | 'yahoo'
export interface FundamentalsResponse {
  metrics: FundamentalMetric[]
  source: FundamentalsSource
}

const I10_BASE = 'https://investidor10.com.br'
const UA = 'Mozilla/5.0 (compatible; FluxFinance/2.0)'

const INDICATOR_LABELS: Record<string, { id: string; label: string; hint?: string; pct?: boolean }> = {
  'P/L': { id: 'pl', label: 'P/L', hint: 'Preço / lucro (12m)' },
  'P/VP': { id: 'pvp', label: 'P/VP', hint: 'Preço / valor patrimonial' },
  'Dividend Yield': { id: 'dy', label: 'DY', hint: 'Dividend yield (12m)', pct: true },
  LPA: { id: 'lpa', label: 'LPA', hint: 'Lucro por ação' },
  VPA: { id: 'vpa', label: 'VPA', hint: 'Valor patrimonial por ação' },
  ROE: { id: 'roe', label: 'ROE', hint: 'Retorno sobre patrimônio', pct: true },
  ROA: { id: 'roa', label: 'ROA', pct: true },
  ROIC: { id: 'roic', label: 'ROIC', pct: true },
  Payout: { id: 'payout', label: 'Payout', pct: true },
  'Margem Líquida': { id: 'margem', label: 'Margem líquida', pct: true },
  'P/Ebit': { id: 'pebit', label: 'P/Ebit' },
  'EV/Ebit': { id: 'evebit', label: 'EV/Ebit' },
  'Liquidez Corrente': { id: 'liq', label: 'Liquidez corrente' },
  'Dívida Líquida / Patrimônio': { id: 'divida', label: 'Dív. líq. / PL' },
}

const VALID_KINDS = new Set<AssetKind>(['stock', 'fii', 'etf', 'bdr', 'crypto', 'index', 'commodity'])
const VALID_REGIONS = new Set<StockRegion>(['us', 'br', 'global'])

function fmtNum(v: number, decimals = 2): string {
  return v.toFixed(decimals).replace('.', ',')
}

export function investidor10PageUrl(symbol: string, kind: AssetKind, region: StockRegion): string | null {
  const sym = symbol.replace(/\.SA$/i, '').toLowerCase()
  let path: string | null = null
  switch (kind) {
    case 'stock':
      path = region === 'br' ? `/acoes/${sym}/` : `/stocks/${sym}/`
      break
    case 'fii':
      path = `/fiis/${sym}/`
      break
    case 'bdr':
      path = `/bdrs/${sym}/`
      break
    case 'etf':
      path = region === 'br' ? `/etfs/${sym}/` : `/stocks/${sym}/`
      break
    default:
      return null
  }
  return `${I10_BASE}${path}`
}

export function parseInvestidor10Indicators(html: string): Map<string, number> {
  const out = new Map<string, number>()
  const re = /data-indicator="([^"$]+)"[\s\S]*?data-current-value="(-?[\d.,]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const name = m[1].trim()
    const raw = m[2].replace(',', '.')
    const val = Number(raw)
    if (Number.isFinite(val)) out.set(name, val)
  }
  return out
}

export function buildFundamentalsFromInvestidor10(html: string, kind: AssetKind): FundamentalMetric[] {
  const parsed = parseInvestidor10Indicators(html)
  const rows: FundamentalMetric[] = []
  const seen = new Set<string>()
  for (const [indicator, meta] of Object.entries(INDICATOR_LABELS)) {
    const val = parsed.get(indicator)
    if (val == null || seen.has(meta.id)) continue
    seen.add(meta.id)
    const value = meta.pct ? `${fmtNum(val)}%` : fmtNum(val)
    rows.push({
      id: meta.id,
      label: kind === 'fii' && meta.id === 'dy' ? 'DY (12m)' : meta.label,
      value,
      hint: meta.hint,
    })
  }
  return rows
}

export function parseFundamentalsQuery(query: Record<string, string | string[] | undefined>): {
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
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
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
  _currency: 'BRL' | 'USD',
): Promise<FundamentalsResponse> {
  const fromI10 = await fetchFromInvestidor10(symbol, kind, region)
  if (fromI10) return { metrics: fromI10, source: 'investidor10' }
  return { metrics: [], source: 'yahoo' }
}
