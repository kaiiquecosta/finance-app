/**
 * Série histórica de um ativo (Yahoo chart) via proxy `/api/market/chart`.
 * Usada na página de detalhe do Investidor (gráfico por período + indicadores).
 */

export type ChartRange = '1d' | '5d' | '1mo' | '6mo' | '1y' | '5y'

export const RANGE_OPTIONS: { id: ChartRange; label: string; interval: string }[] = [
  { id: '1d', label: '1D', interval: '5m' },
  { id: '5d', label: '5D', interval: '15m' },
  { id: '1mo', label: '1M', interval: '1d' },
  { id: '6mo', label: '6M', interval: '1d' },
  { id: '1y', label: '1A', interval: '1d' },
  { id: '5y', label: '5A', interval: '1wk' },
]

export interface ChartMeta {
  symbol: string
  currency: string
  longName?: string
  shortName?: string
  exchangeName?: string
  fullExchangeName?: string
  instrumentType?: string
  regularMarketPrice?: number
  chartPreviousClose?: number
  regularMarketDayHigh?: number
  regularMarketDayLow?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  regularMarketVolume?: number
}

export interface ChartSeries {
  meta: ChartMeta
  /** epoch segundos */
  timestamps: number[]
  closes: number[]
  volumes: number[]
}

type YahooChartPayload = {
  chart?: {
    result?: Array<{
      meta?: ChartMeta
      timestamp?: number[]
      indicators?: { quote?: Array<{ close?: (number | null)[]; volume?: (number | null)[] }> }
    }>
    error?: unknown
  }
}

/** Normaliza o payload do Yahoo chart, removendo pontos nulos (pura). */
export function parseYahooChart(json: unknown): ChartSeries | null {
  const result = (json as YahooChartPayload)?.chart?.result?.[0]
  if (!result?.meta) return null
  const ts = result.timestamp ?? []
  const quote = result.indicators?.quote?.[0]
  const closesRaw = quote?.close ?? []
  const volumesRaw = quote?.volume ?? []

  const timestamps: number[] = []
  const closes: number[] = []
  const volumes: number[] = []
  for (let i = 0; i < ts.length; i++) {
    const c = closesRaw[i]
    if (c == null || !Number.isFinite(c)) continue
    timestamps.push(ts[i])
    closes.push(c)
    volumes.push(Number(volumesRaw[i]) || 0)
  }
  return { meta: result.meta, timestamps, closes, volumes }
}

export interface PeriodReturn {
  label: string
  pct: number | null
}

const DAY_S = 86_400

/**
 * Retornos por janela (1 sem, 1 mês, 3m, 6m, 1a, no ano) a partir de uma
 * série diária de ~1 ano (pura). `null` quando a janela não cabe na série.
 */
export function periodReturns(timestamps: number[], closes: number[], asOf: Date = new Date()): PeriodReturn[] {
  if (timestamps.length < 2 || closes.length !== timestamps.length) {
    return WINDOWS.map((w) => ({ label: w.label, pct: null }))
  }
  const last = closes[closes.length - 1]
  const nowS = Math.floor(asOf.getTime() / 1000)
  const startOfYearS = Math.floor(new Date(asOf.getFullYear(), 0, 1).getTime() / 1000)

  const pctSince = (cutoff: number): number | null => {
    let base: number | null = null
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] >= cutoff) {
        base = closes[i]
        break
      }
    }
    if (base == null || base === 0) return null
    if (timestamps[0] > cutoff + 7 * DAY_S) return null // série não cobre a janela
    return ((last - base) / base) * 100
  }

  return WINDOWS.map((w) => ({
    label: w.label,
    pct: w.ytd ? pctSince(startOfYearS) : pctSince(nowS - w.days * DAY_S),
  }))
}

const WINDOWS: { label: string; days: number; ytd?: boolean }[] = [
  { label: '1 sem', days: 7 },
  { label: '1 mês', days: 30 },
  { label: '3 meses', days: 91 },
  { label: '6 meses', days: 182 },
  { label: 'No ano', days: 0, ytd: true },
  { label: '12 meses', days: 365 },
]

export interface AssetStats {
  price: number | null
  previousClose: number | null
  dayChangePct: number | null
  dayHigh: number | null
  dayLow: number | null
  high52w: number | null
  low52w: number | null
  /** Distância da máxima de 52 semanas (%; negativo = abaixo da máxima). */
  fromHigh52wPct: number | null
  volume: number | null
  /** Volatilidade anualizada aproximada (% — desvio-padrão dos retornos diários). */
  volatilityPct: number | null
}

/** Indicadores derivados de uma série de ~1 ano + meta (pura). */
export function assetStats(series: ChartSeries): AssetStats {
  const { meta, closes, volumes } = series
  const price = meta.regularMarketPrice ?? (closes.length ? closes[closes.length - 1] : null)
  const previousClose = meta.chartPreviousClose ?? null

  const positive = (n: number | undefined | null): number | null =>
    n != null && Number.isFinite(n) && n > 0 ? n : null

  const high52w = positive(meta.fiftyTwoWeekHigh) ?? (closes.length ? Math.max(...closes) : null)
  const low52w = positive(meta.fiftyTwoWeekLow) ?? (closes.length ? Math.min(...closes) : null)
  const dayHigh = positive(meta.regularMarketDayHigh)
  const dayLow = positive(meta.regularMarketDayLow)

  let volume = positive(meta.regularMarketVolume)
  if (volume == null && volumes.length) {
    const lastVol = volumes[volumes.length - 1]
    volume = lastVol > 0 ? lastVol : null
  }

  let dayChangePct: number | null = null
  if (price != null && previousClose != null && previousClose !== 0) {
    dayChangePct = ((price - previousClose) / previousClose) * 100
  }

  let fromHigh52wPct: number | null = null
  if (price != null && high52w != null && high52w !== 0) {
    fromHigh52wPct = ((price - high52w) / high52w) * 100
  }

  let volatilityPct: number | null = null
  if (closes.length > 30) {
    const rets: number[] = []
    for (let i = 1; i < closes.length; i++) {
      if (closes[i - 1] !== 0) rets.push(closes[i] / closes[i - 1] - 1)
    }
    if (rets.length > 10) {
      const mean = rets.reduce((s, r) => s + r, 0) / rets.length
      const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length
      volatilityPct = Math.sqrt(variance) * Math.sqrt(252) * 100
    }
  }

  return { price, previousClose, dayChangePct, dayHigh, dayLow, high52w, low52w, fromHigh52wPct, volume, volatilityPct }
}

const YAHOO_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart/'

export async function fetchYahooChartRaw(
  symbol: string,
  rangeOrOpts: string | { range?: string; interval?: string; period1?: number; period2?: number },
  intervalArg?: string,
): Promise<unknown> {
  const q = new URLSearchParams()
  if (typeof rangeOrOpts === 'string') {
    q.set('range', rangeOrOpts)
    q.set('interval', intervalArg ?? '1d')
  } else {
    if (rangeOrOpts.period1 != null && rangeOrOpts.period2 != null) {
      q.set('period1', String(rangeOrOpts.period1))
      q.set('period2', String(rangeOrOpts.period2))
    } else {
      q.set('range', rangeOrOpts.range ?? '1mo')
    }
    q.set('interval', rangeOrOpts.interval ?? '1d')
  }
  const res = await fetch(`${YAHOO_CHART}${encodeURIComponent(symbol)}?${q.toString()}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FluxFinance/2.0)' },
  })
  if (!res.ok) throw new Error(`Yahoo chart HTTP ${res.status}`)
  return res.json()
}

export async function fetchChartSeries(symbol: string, range: ChartRange): Promise<ChartSeries> {
  const opt = RANGE_OPTIONS.find((r) => r.id === range) ?? RANGE_OPTIONS[0]
  const q = new URLSearchParams({ symbol, range: opt.id, interval: opt.interval })
  const res = await fetch(`/api/market/chart?${q.toString()}`)
  if (!res.ok) throw new Error('Falha ao buscar histórico do ativo')
  const parsed = parseYahooChart(await res.json())
  if (!parsed) throw new Error('Ativo não encontrado')
  return parsed
}
