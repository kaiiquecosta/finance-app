/**
 * Fundamentos do ativo (DY, P/VP, P/L…) via Investidor10 ou Yahoo quoteSummary.
 */
import type { AssetKind, StockRegion } from './catalog/types'

type YahooNum = { raw?: number; fmt?: string } | undefined

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

export type FundamentalRaw = {
  dividendYield: number | null
  dividendRate: number | null
  priceToBook: number | null
  trailingPe: number | null
  forwardPe: number | null
  trailingEps: number | null
  forwardEps: number | null
  bookValue: number | null
  marketCap: number | null
  beta: number | null
  profitMargins: number | null
  returnOnEquity: number | null
  returnOnAssets: number | null
  debtToEquity: number | null
  currentRatio: number | null
  revenueGrowth: number | null
  earningsGrowth: number | null
  payoutRatio: number | null
  enterpriseToEbitda: number | null
  pegRatio: number | null
  averageVolume: number | null
}

type YahooQuoteSummary = {
  quoteSummary?: {
    result?: Array<{
      summaryDetail?: Record<string, YahooNum>
      defaultKeyStatistics?: Record<string, YahooNum>
      financialData?: Record<string, YahooNum>
    }>
  }
}

function num(v: YahooNum): number | null {
  const n = v?.raw
  return n != null && Number.isFinite(n) ? n : null
}

function pctFromRatio(v: number | null, decimals = 2): string {
  if (v == null) return '—'
  const pct = Math.abs(v) <= 1 ? v * 100 : v
  return `${pct.toFixed(decimals).replace('.', ',')}%`
}

function numFmt(v: number | null, decimals = 2): string {
  if (v == null) return '—'
  return v.toFixed(decimals).replace('.', ',')
}

function compactMoney(v: number | null, currency: 'BRL' | 'USD'): string {
  if (v == null) return '—'
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US'
  const cur = currency === 'BRL' ? 'BRL' : 'USD'
  if (Math.abs(v) >= 1e12) {
    return (v / 1e12).toLocaleString(locale, { maximumFractionDigits: 2 }) + ' tri'
  }
  if (Math.abs(v) >= 1e9) {
    return (v / 1e9).toLocaleString(locale, { maximumFractionDigits: 2 }) + ' bi'
  }
  if (Math.abs(v) >= 1e6) {
    return (v / 1e6).toLocaleString(locale, { maximumFractionDigits: 2 }) + ' mi'
  }
  return v.toLocaleString(locale, { style: 'currency', currency: cur, maximumFractionDigits: 0 })
}

function moneyPerShare(v: number | null, currency: 'BRL' | 'USD'): string {
  if (v == null) return '—'
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US'
  const cur = currency === 'BRL' ? 'BRL' : 'USD'
  return v.toLocaleString(locale, { style: 'currency', currency: cur, maximumFractionDigits: 2 })
}

export function extractFundamentalRaw(json: unknown): FundamentalRaw | null {
  const row = (json as YahooQuoteSummary)?.quoteSummary?.result?.[0]
  if (!row) return null
  const sd = row.summaryDetail ?? {}
  const ks = row.defaultKeyStatistics ?? {}
  const fd = row.financialData ?? {}

  return {
    dividendYield:
      num(sd.dividendYield) ??
      num(sd.trailingAnnualDividendYield) ??
      num(ks.yield) ??
      num(ks.trailingAnnualDividendYield),
    dividendRate: num(sd.trailingAnnualDividendRate) ?? num(ks.trailingAnnualDividendRate),
    priceToBook: num(ks.priceToBook) ?? num(sd.priceToBook),
    trailingPe: num(sd.trailingPE) ?? num(ks.trailingPE),
    forwardPe: num(sd.forwardPE) ?? num(ks.forwardPE),
    trailingEps: num(ks.trailingEps) ?? num(sd.trailingEps),
    forwardEps: num(ks.forwardEps),
    bookValue: num(ks.bookValue) ?? num(sd.bookValue),
    marketCap: num(sd.marketCap) ?? num(ks.marketCap),
    beta: num(sd.beta) ?? num(ks.beta),
    profitMargins: num(ks.profitMargins) ?? num(fd.profitMargins),
    returnOnEquity: num(fd.returnOnEquity) ?? num(ks.returnOnEquity),
    returnOnAssets: num(fd.returnOnAssets),
    debtToEquity: num(fd.debtToEquity) ?? num(ks.debtToEquity),
    currentRatio: num(fd.currentRatio),
    revenueGrowth: num(fd.revenueGrowth),
    earningsGrowth: num(fd.earningsGrowth),
    payoutRatio: num(ks.payoutRatio) ?? num(sd.payoutRatio),
    enterpriseToEbitda: num(ks.enterpriseToEbitda),
    pegRatio: num(ks.pegRatio),
    averageVolume: num(sd.averageVolume) ?? num(sd.averageVolume10days),
  }
}

/** Monta linhas de exibição conforme a classe do ativo. */
export function buildFundamentalMetrics(
  raw: FundamentalRaw | null,
  kind: AssetKind,
  currency: 'BRL' | 'USD',
): FundamentalMetric[] {
  if (!raw) return []

  const rows: FundamentalMetric[] = []
  const push = (id: string, label: string, value: string, hint?: string) => {
    if (value !== '—') rows.push({ id, label, value, hint })
  }

  if (kind === 'crypto' || kind === 'commodity' || kind === 'index') {
    push('mktcap', 'Valor de mercado', compactMoney(raw.marketCap, currency))
    push('beta', 'Beta', numFmt(raw.beta, 2))
    return rows
  }

  if (kind === 'etf') {
    push('dy', 'Dividend yield', pctFromRatio(raw.dividendYield))
    push('pvp', 'P/VP', numFmt(raw.priceToBook, 2))
    push('pl', 'P/L', numFmt(raw.trailingPe, 1))
    push('mktcap', 'Patrimônio / cap.', compactMoney(raw.marketCap, currency))
    push('beta', 'Beta', numFmt(raw.beta, 2))
    return rows
  }

  push(
    'dy',
    kind === 'fii' ? 'Dividend yield (DY)' : 'Dividend yield',
    pctFromRatio(raw.dividendYield),
    kind === 'fii' ? 'Últimos 12 meses (Yahoo)' : undefined,
  )
  push('pvp', 'P/VP', numFmt(raw.priceToBook, 2), 'Preço / valor patrimonial')
  push('pl', 'P/L', numFmt(raw.trailingPe, 1), 'Preço / lucro (12m)')
  push('plf', 'P/L projetado', numFmt(raw.forwardPe, 1))
  push('lpa', 'LPA', moneyPerShare(raw.trailingEps, currency), 'Lucro por ação')
  push('vpa', 'VPA', moneyPerShare(raw.bookValue, currency), 'Valor patrimonial por ação')
  push('dyr', 'Dividendo / cota', moneyPerShare(raw.dividendRate, currency), 'Proventos 12m por cota')
  push('roe', 'ROE', pctFromRatio(raw.returnOnEquity), 'Retorno sobre patrimônio')
  push('margem', 'Margem líquida', pctFromRatio(raw.profitMargins))
  push('divida', 'Dívida / PL', numFmt(raw.debtToEquity, 1))
  push('payout', 'Payout', pctFromRatio(raw.payoutRatio))
  push('peg', 'PEG', numFmt(raw.pegRatio, 2))
  push('ev/ebitda', 'EV / EBITDA', numFmt(raw.enterpriseToEbitda, 1))
  push('beta', 'Beta', numFmt(raw.beta, 2))
  push('mktcap', 'Valor de mercado', compactMoney(raw.marketCap, currency))
  push('cresc_receita', 'Cresc. receita', pctFromRatio(raw.revenueGrowth))
  push('cresc_lucro', 'Cresc. lucro', pctFromRatio(raw.earningsGrowth))

  return rows
}

const YAHOO_SUMMARY = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary/'

export async function fetchYahooFundamentalsRaw(symbol: string): Promise<unknown> {
  const q = new URLSearchParams({
    modules: 'summaryDetail,defaultKeyStatistics,financialData,price',
  })
  const res = await fetch(`${YAHOO_SUMMARY}${encodeURIComponent(symbol)}?${q.toString()}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FluxFinance/2.0)' },
  })
  if (!res.ok) throw new Error(`Yahoo fundamentals HTTP ${res.status}`)
  return res.json()
}

export async function fetchAssetFundamentals(
  symbol: string,
  kind: AssetKind,
  region: StockRegion,
  currency: 'BRL' | 'USD',
): Promise<FundamentalMetric[]> {
  const q = new URLSearchParams({
    symbol,
    kind,
    region,
    currency,
  })
  const res = await fetch(`/api/market/fundamentals?${q.toString()}`)
  if (!res.ok) throw new Error('Falha ao buscar fundamentos')
  const body = (await res.json()) as FundamentalsResponse
  return body.metrics ?? []
}
