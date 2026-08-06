/**
 * Cotações de ações via Yahoo Finance (spark), consumidas pelo proxy `/api/market/spark`.
 */
import { ALL_STOCKS, stockByYahoo, type StockDef } from './stocksCatalog'

export interface StockQuote {
  yahoo: string
  symbol: string
  name: string
  exchange: string
  region: StockDef['region']
  icon: string
  currency: 'USD' | 'BRL'
  price: number
  pctChange: number
  /** Série intraday (últimos pontos) para mini-gráfico. */
  sparkline: number[]
  updatedAt: number
}

type YahooSparkEntry = {
  close?: number[]
  previousClose?: number
  chartPreviousClose?: number
  timestamp?: number[]
}

export function parseYahooSparkPayload(
  data: Record<string, YahooSparkEntry>,
  catalog: StockDef[] = ALL_STOCKS,
): StockQuote[] {
  const out: StockQuote[] = []
  for (const def of catalog) {
    const row = data[def.yahoo]
    if (!row?.close?.length) continue
    const closes = row.close.filter((n) => Number.isFinite(n))
    if (!closes.length) continue
    const price = closes[closes.length - 1]
    const prev = row.previousClose ?? row.chartPreviousClose ?? closes[0]
    const pctChange = prev ? ((price - prev) / prev) * 100 : 0
    const ts = row.timestamp?.length ? row.timestamp[row.timestamp.length - 1] * 1000 : Date.now()
    out.push({
      yahoo: def.yahoo,
      symbol: def.symbol,
      name: def.name,
      exchange: def.exchange,
      region: def.region,
      icon: def.icon,
      currency: def.currency,
      price,
      pctChange,
      sparkline: closes.slice(-24),
      updatedAt: ts,
    })
  }
  return out.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
}

export function mergeSparkWithCatalog(data: Record<string, YahooSparkEntry>): StockQuote[] {
  const known = new Set(ALL_STOCKS.map((s) => s.yahoo))
  const quotes = parseYahooSparkPayload(data)
  for (const key of Object.keys(data)) {
    if (known.has(key)) continue
    const def = stockByYahoo(key)
    if (!def) continue
    quotes.push(...parseYahooSparkPayload({ [key]: data[key] }, [def]))
  }
  return quotes
}

const YAHOO_SPARK = 'https://query2.finance.yahoo.com/v8/finance/spark'

export async function fetchYahooSparkRaw(symbols: string[]): Promise<Record<string, YahooSparkEntry>> {
  if (symbols.length === 0) return {}
  const q = new URLSearchParams({
    symbols: symbols.join(','),
    range: '1d',
    interval: '5m',
  })
  const res = await fetch(`${YAHOO_SPARK}?${q.toString()}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FluxFinance/2.0)' },
  })
  if (!res.ok) throw new Error(`Yahoo spark HTTP ${res.status}`)
  return (await res.json()) as Record<string, YahooSparkEntry>
}

export async function fetchStockQuotes(symbols?: string[]): Promise<StockQuote[]> {
  const list = symbols ?? ALL_STOCKS.map((s) => s.yahoo)
  const res = await fetch(`/api/market/spark?symbols=${encodeURIComponent(list.join(','))}`)
  if (!res.ok) throw new Error('Falha ao buscar ações')
  const data = (await res.json()) as Record<string, YahooSparkEntry>
  return parseYahooSparkPayload(data)
}
