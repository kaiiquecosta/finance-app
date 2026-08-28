import type { AssetStats, ChartSeries } from './marketChart'

/** Aplica cotação ao vivo nos indicadores do dia (preço, variação, mín/máx). */
export function applyLiveQuoteToStats(stats: AssetStats, price: number): AssetStats {
  const previousClose = stats.previousClose
  let dayChangePct = stats.dayChangePct
  if (previousClose != null && previousClose !== 0) {
    dayChangePct = ((price - previousClose) / previousClose) * 100
  }

  let dayHigh = stats.dayHigh
  let dayLow = stats.dayLow
  if (dayHigh == null || price > dayHigh) dayHigh = price
  if (dayLow == null || price < dayLow) dayLow = price

  let fromHigh52wPct = stats.fromHigh52wPct
  if (stats.high52w != null && stats.high52w !== 0) {
    fromHigh52wPct = ((price - stats.high52w) / stats.high52w) * 100
  }

  return { ...stats, price, dayChangePct, dayHigh, dayLow, fromHigh52wPct }
}

/** Atualiza o último ponto (ou acrescenta barra) do gráfico intraday com preço ao vivo. */
export function mergeLiveQuoteIntoChart(
  series: ChartSeries,
  price: number,
  updatedAtMs: number,
): ChartSeries {
  const { timestamps, closes, volumes } = series
  if (!closes.length) return series

  const liveTs = Math.floor(updatedAtMs / 1000)
  const lastIdx = closes.length - 1
  const lastTs = timestamps[lastIdx]

  if (liveTs > lastTs + 240) {
    return {
      ...series,
      timestamps: [...timestamps, liveTs],
      closes: [...closes, price],
      volumes: [...volumes, volumes[lastIdx] ?? 0],
    }
  }

  const nextCloses = closes.slice()
  nextCloses[lastIdx] = price
  return { ...series, closes: nextCloses }
}
