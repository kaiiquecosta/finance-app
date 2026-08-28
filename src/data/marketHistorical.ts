/**
 * Preço histórico de fechamento (Yahoo chart) para calcular compra por data.
 */
import { parseYahooChart, type ChartSeries } from './marketChart'
import type { ISODate } from '@/domain/entities'

const DAY_S = 86_400

/** Fechamento no dia ou no último pregão anterior à data informada. */
export function closeOnOrBeforeDate(series: ChartSeries, date: ISODate): number | null {
  const targetS = Math.floor(new Date(`${date}T23:59:59`).getTime() / 1000)
  let bestTs = -1
  let bestClose: number | null = null
  for (let i = 0; i < series.timestamps.length; i++) {
    const ts = series.timestamps[i]
    if (ts > targetS) break
    bestTs = ts
    bestClose = series.closes[i]
  }
  if (bestClose == null || bestTs < 0) return null
  // Descarta se a série não cobre a data (só tem dados muito antigos).
  if (targetS - bestTs > 10 * DAY_S) return null
  return bestClose
}

export interface HistoricalPriceResult {
  price: number
  /** Data efetiva do pregão usado (pode ser anterior se mercado fechado). */
  tradeDate: ISODate
}

function tradeDateFromTimestamp(ts: number): ISODate {
  const d = new Date(ts * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function historicalPriceFromSeries(series: ChartSeries, date: ISODate): HistoricalPriceResult | null {
  const targetS = Math.floor(new Date(`${date}T23:59:59`).getTime() / 1000)
  let bestTs = -1
  let bestClose: number | null = null
  for (let i = 0; i < series.timestamps.length; i++) {
    const ts = series.timestamps[i]
    if (ts > targetS) break
    bestTs = ts
    bestClose = series.closes[i]
  }
  if (bestClose == null || bestTs < 0) return null
  if (targetS - bestTs > 10 * DAY_S) return null
  return { price: bestClose, tradeDate: tradeDateFromTimestamp(bestTs) }
}

export async function fetchHistoricalClose(symbol: string, date: ISODate): Promise<HistoricalPriceResult | null> {
  const dayStart = Math.floor(new Date(`${date}T00:00:00`).getTime() / 1000)
  const period1 = dayStart - 14 * DAY_S
  const period2 = dayStart + DAY_S
  const q = new URLSearchParams({
    symbol,
    interval: '1d',
    period1: String(period1),
    period2: String(period2),
  })
  const res = await fetch(`/api/market/chart?${q.toString()}`)
  if (!res.ok) return null
  const series = parseYahooChart(await res.json())
  if (!series) return null
  return historicalPriceFromSeries(series, date)
}

/** Quantidade de cotas/ações compradas com o valor informado. */
export function sharesFromAmount(amountReais: number, buyPrice: number): number {
  if (buyPrice <= 0 || amountReais <= 0) return 0
  return amountReais / buyPrice
}
