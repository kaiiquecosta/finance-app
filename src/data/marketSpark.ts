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

/** Yahoo spark falha acima de ~20 tickers na mesma URL — validado em produção. */
export const SPARK_BATCH_SIZE = 18

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

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

async function fetchSparkBatch(symbols: string[]): Promise<Record<string, YahooSparkEntry>> {
  const res = await fetch(`/api/market/spark?symbols=${encodeURIComponent(symbols.join(','))}`)
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(err?.error ?? `spark HTTP ${res.status}`)
  }
  return (await res.json()) as Record<string, YahooSparkEntry>
}

export async function fetchStockQuotes(symbols?: string[]): Promise<StockQuote[]> {
  const list = symbols ?? ALL_STOCKS.map((s) => s.yahoo)
  const batches = chunk(list, SPARK_BATCH_SIZE)
  const merged: Record<string, YahooSparkEntry> = {}

  const results = await Promise.allSettled(batches.map((b) => fetchSparkBatch(b)))
  let ok = 0
  for (const r of results) {
    if (r.status === 'fulfilled') {
      ok++
      Object.assign(merged, r.value)
    }
  }
  if (ok === 0) throw new Error('Falha ao buscar ações')

  const quotes = parseYahooSparkPayload(merged)
  if (quotes.length === 0) throw new Error('Nenhuma cotação retornada')
  return quotes
}
