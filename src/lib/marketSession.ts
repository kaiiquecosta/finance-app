/** Horário de pregão da B3 (BRT, relógio local do usuário). */
export function brMarketOpen(now = new Date()): boolean {
  const h = now.getHours()
  const wd = now.getDay()
  return h >= 10 && h < 18 && wd >= 1 && wd <= 5
}

/** Intervalo de polling para cotação ao vivo (Investidor). */
export function liveQuoteRefetchMs(now = new Date()): number {
  return brMarketOpen(now) ? 10_000 : 60_000
}

/** Intervalo de polling do gráfico intraday com modal aberto. */
export function liveChartRefetchMs(range: '1d' | '5d' | string, now = new Date()): number {
  const intraday = range === '1d' || range === '5d'
  if (!intraday) return 5 * 60_000
  return brMarketOpen(now) ? 15_000 : 60_000
}

export function marketSessionLabel(now = new Date()): { label: string; open: boolean } {
  const open = brMarketOpen(now)
  return { label: open ? 'B3 aberta' : 'B3 fechada', open }
}
