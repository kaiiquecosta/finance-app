/**
 * Fundamentos (P/L, P/VP, DY…) via página pública do Investidor10.
 * Usado quando o Yahoo quoteSummary exige crumb indisponível no proxy.
 */
import type { AssetKind, StockRegion } from './catalog/types'
import type { FundamentalMetric } from './marketFundamentals'

const BASE = 'https://investidor10.com.br'

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

/** Caminho relativo no Investidor10 ou null se não houver página. */
export function investidor10PagePath(symbol: string, kind: AssetKind, region: StockRegion): string | null {
  const sym = symbol.replace(/\.SA$/i, '').toLowerCase()
  switch (kind) {
    case 'stock':
      return region === 'br' ? `/acoes/${sym}/` : `/stocks/${sym}/`
    case 'fii':
      return `/fiis/${sym}/`
    case 'bdr':
      return `/bdrs/${sym}/`
    case 'etf':
      return region === 'br' ? `/etfs/${sym}/` : `/stocks/${sym}/`
    default:
      return null
  }
}

export function investidor10PageUrl(symbol: string, kind: AssetKind, region: StockRegion): string | null {
  const path = investidor10PagePath(symbol, kind, region)
  return path ? `${BASE}${path}` : null
}

function fmtNum(v: number, decimals = 2): string {
  return v.toFixed(decimals).replace('.', ',')
}

/** Extrai pares indicador → valor numérico do HTML do Investidor10. */
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

export function buildFundamentalsFromInvestidor10(
  html: string,
  kind: AssetKind,
): FundamentalMetric[] {
  const parsed = parseInvestidor10Indicators(html)
  const rows: FundamentalMetric[] = []
  const seen = new Set<string>()

  for (const [indicator, meta] of Object.entries(INDICATOR_LABELS)) {
    const val = parsed.get(indicator)
    if (val == null || seen.has(meta.id)) continue
    seen.add(meta.id)
    const value = meta.pct ? `${fmtNum(val)}%` : fmtNum(val, meta.id === 'pl' ? 2 : 2)
    rows.push({ id: meta.id, label: kind === 'fii' && meta.id === 'dy' ? 'DY (12m)' : meta.label, value, hint: meta.hint })
  }

  return rows
}

/** Métricas principais para cards no topo do detalhe. */
export function pickKeyFundamentals(metrics: FundamentalMetric[]): {
  pl: string
  pvp: string
  dy: string
} {
  const find = (id: string) => metrics.find((m) => m.id === id)?.value ?? '—'
  return { pl: find('pl'), pvp: find('pvp'), dy: find('dy') }
}
