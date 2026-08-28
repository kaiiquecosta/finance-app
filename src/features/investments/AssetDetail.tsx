import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyLiveQuoteToStats, mergeLiveQuoteIntoChart } from '@/data/liveQuote'
import { useChartSeries, useYearSeries } from '@/data/useMarketChart'
import { useLiveStockQuote } from '@/data/useLiveStockQuote'
import { RANGE_OPTIONS, assetStats, periodReturns, type ChartRange } from '@/data/marketChart'
import { stockByYahoo } from '@/data/stocksCatalog'
import { brMarketOpen } from '@/lib/marketSession'
import styles from './AssetDetail.module.css'

type Props = {
  symbol: string
  onClose: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
}

function fmtMoney(v: number | null | undefined, currency: string): string {
  if (v == null || !Number.isFinite(v)) return '—'
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US'
  return v.toLocaleString(locale, { style: 'currency', currency, maximumFractionDigits: v >= 10_000 ? 0 : 2 })
}

function fmtPct(v: number | null | undefined, signed = true): string {
  if (v == null || !Number.isFinite(v)) return '—'
  const s = signed && v > 0 ? '+' : ''
  return `${s}${v.toFixed(2).replace('.', ',')}%`
}

function fmtVolume(v: number | null): string {
  if (v == null || v <= 0) return '—'
  if (v >= 1e9) return (v / 1e9).toFixed(1).replace('.', ',') + ' bi'
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' mi'
  if (v >= 1e3) return (v / 1e3).toFixed(1).replace('.', ',') + ' mil'
  return String(Math.round(v))
}

function fmtHoverTime(ts: number, range: ChartRange): string {
  const d = new Date(ts * 1000)
  if (range === '1d' || range === '5d') {
    return d.toLocaleString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function indexAtRatio(length: number, ratio: number): number {
  if (length <= 1) return 0
  return Math.max(0, Math.min(length - 1, Math.round(ratio * (length - 1))))
}

function BigChart({
  timestamps,
  closes,
  range,
  onHover,
}: {
  timestamps: number[]
  closes: number[]
  range: ChartRange
  onHover: (point: { price: number; ts: number; index: number } | null) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  useEffect(() => {
    setHoverIndex(null)
    onHover(null)
  }, [timestamps, closes, range, onHover])

  const pickAtClientX = useCallback(
    (clientX: number) => {
      const el = wrapRef.current
      if (!el || closes.length < 2) return
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0) return
      const ratio = (clientX - rect.left) / rect.width
      const index = indexAtRatio(closes.length, ratio)
      setHoverIndex(index)
      onHover({ index, price: closes[index], ts: timestamps[index] })
    },
    [closes, timestamps, onHover],
  )

  const clearHover = useCallback(() => {
    setHoverIndex(null)
    onHover(null)
  }, [onHover])

  if (closes.length < 2) {
    return <div className={styles.chartEmpty}>Sem dados para este período.</div>
  }
  const w = 640
  const h = 180
  const pad = 4
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const span = max - min || 1
  const pts = closes.map((v, i) => {
    const x = pad + (i / (closes.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / span) * (h - pad * 2)
    return [x, y] as const
  })
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`
  const up = closes[closes.length - 1] >= closes[0]
  const color = up ? 'var(--green)' : 'var(--red)'
  const active = hoverIndex != null ? pts[hoverIndex] : null

  const fmtTick = (ts: number): string => {
    const d = new Date(ts * 1000)
    if (range === '1d' || range === '5d') {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    if (range === '5y') return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }
  const tickIdx = [0, Math.floor(timestamps.length / 2), timestamps.length - 1]

  return (
    <div
      ref={wrapRef}
      className={styles.chartWrap}
      onMouseMove={(e) => pickAtClientX(e.clientX)}
      onMouseLeave={clearHover}
      onTouchStart={(e) => {
        const t = e.touches[0]
        if (t) pickAtClientX(t.clientX)
      }}
      onTouchMove={(e) => {
        const t = e.touches[0]
        if (t) pickAtClientX(t.clientX)
      }}
      onTouchEnd={clearHover}
    >
      <svg className={styles.chart} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="assetFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#assetFill)" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {active && (
          <>
            <line
              x1={active[0]}
              y1={pad}
              x2={active[0]}
              y2={h - pad}
              stroke="var(--muted)"
              strokeWidth="1"
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
              opacity="0.85"
            />
            <circle
              cx={active[0]}
              cy={active[1]}
              r="5"
              fill="var(--card)"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>
      <div className={styles.chartTicks}>
        {tickIdx.map((i) => (
          <span key={i}>{fmtTick(timestamps[i])}</span>
        ))}
      </div>
    </div>
  )
}

export function AssetDetail({ symbol, onClose, isFavorite, onToggleFavorite }: Props) {
  const [range, setRange] = useState<ChartRange>('1d')
  const [hoverPoint, setHoverPoint] = useState<{ price: number; ts: number; index: number } | null>(null)
  const [tickDir, setTickDir] = useState<'up' | 'down' | null>(null)
  const prevLivePrice = useRef<number | null>(null)

  const live = useLiveStockQuote(symbol)
  const chart = useChartSeries(symbol, range, true)
  const year = useYearSeries(symbol)

  const onChartHover = useCallback((point: { price: number; ts: number; index: number } | null) => {
    setHoverPoint(point)
  }, [])

  useEffect(() => {
    setHoverPoint(null)
  }, [range, symbol])

  useEffect(() => {
    const price = live.data?.price
    if (price == null) return
    const prev = prevLivePrice.current
    if (prev != null && price !== prev) {
      setTickDir(price > prev ? 'up' : 'down')
      const timer = window.setTimeout(() => setTickDir(null), 800)
      prevLivePrice.current = price
      return () => window.clearTimeout(timer)
    }
    prevLivePrice.current = price
  }, [live.data?.price])

  useEffect(() => {
    prevLivePrice.current = null
    setTickDir(null)
  }, [symbol])

  const def = stockByYahoo(symbol)
  const meta = chart.data?.meta ?? year.data?.meta
  const currency = live.data?.currency ?? meta?.currency ?? def?.currency ?? 'BRL'
  const displayName = def?.name ?? meta?.longName ?? meta?.shortName ?? symbol
  const exchange = def?.exchange ?? meta?.fullExchangeName ?? meta?.exchangeName ?? ''

  const baseStats = useMemo(() => (year.data ? assetStats(year.data) : null), [year.data])
  const stats = useMemo(() => {
    if (!baseStats) return null
    if (live.data?.price == null) return baseStats
    return applyLiveQuoteToStats(baseStats, live.data.price)
  }, [baseStats, live.data?.price])

  const returns = useMemo(
    () => (year.data ? periodReturns(year.data.timestamps, year.data.closes) : []),
    [year.data],
  )

  const chartDisplay = useMemo(() => {
    if (!chart.data || live.data?.price == null) return chart.data
    if (range !== '1d' && range !== '5d') return chart.data
    return mergeLiveQuoteIntoChart(chart.data, live.data.price, live.data.updatedAt)
  }, [chart.data, live.data?.price, live.data?.updatedAt, range])

  const price = stats?.price ?? live.data?.price ?? meta?.regularMarketPrice ?? null
  const dayPct = stats?.dayChangePct ?? live.data?.pctChange ?? null
  const up = (dayPct ?? 0) >= 0
  const sessionOpen = brMarketOpen()

  const chartCloses = chartDisplay?.closes
  const hoverPeriodPct = useMemo(() => {
    if (!hoverPoint || !chartCloses?.length || chartCloses[0] === 0) return null
    return ((hoverPoint.price - chartCloses[0]) / chartCloses[0]) * 100
  }, [hoverPoint, chartCloses])

  const displayPrice = hoverPoint?.price ?? price
  const hoverUp = (hoverPeriodPct ?? 0) >= 0

  const updatedLabel = live.data?.updatedAt
    ? new Date(live.data.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`Detalhes de ${displayName}`}>
      <div className={styles.sheet}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
          ✕
        </button>

        <div className={styles.head}>
          <span className={styles.icon}>{def?.icon ?? '📈'}</span>
          <div className={styles.headInfo}>
            <div className={styles.name}>{displayName}</div>
            <div className={styles.meta}>
              {def?.symbol ?? symbol}
              {exchange ? ` · ${exchange}` : ''}
            </div>
          </div>
          <button
            type="button"
            className={[styles.favBtn, isFavorite ? styles.favActive : ''].filter(Boolean).join(' ')}
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>

        <div className={styles.priceRow}>
          <div className={styles.priceBlock}>
            <span
              className={[
                styles.price,
                tickDir === 'up' ? styles.priceTickUp : '',
                tickDir === 'down' ? styles.priceTickDown : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {fmtMoney(displayPrice, currency)}
            </span>
            {!hoverPoint && (
              <span className={styles.liveMeta}>
                <span className={[styles.liveDot, live.isFetching ? styles.livePulse : ''].filter(Boolean).join(' ')} />
                {sessionOpen ? 'tempo real · ~10s' : 'mercado fechado'}
                {updatedLabel ? ` · ${updatedLabel}` : ''}
              </span>
            )}
          </div>
          {hoverPoint ? (
            <span className={hoverUp ? styles.up : styles.down}>
              {fmtHoverTime(hoverPoint.ts, range)}
              {hoverPeriodPct != null
                ? ` · ${hoverUp ? '▲' : '▼'} ${Math.abs(hoverPeriodPct).toFixed(2).replace('.', ',')}% no período`
                : ''}
            </span>
          ) : (
            <span className={up ? styles.up : styles.down}>
              {dayPct == null ? '' : `${up ? '▲' : '▼'} ${Math.abs(dayPct).toFixed(2).replace('.', ',')}% hoje`}
            </span>
          )}
        </div>

        <div className={styles.ranges}>
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={[styles.rangeBtn, range === r.id ? styles.rangeActive : ''].filter(Boolean).join(' ')}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {chart.isLoading && <div className={styles.chartEmpty}>Carregando gráfico…</div>}
        {chart.isError && <div className={styles.chartEmpty}>Não foi possível carregar o gráfico deste ativo.</div>}
        {chartDisplay && (
          <BigChart
            timestamps={chartDisplay.timestamps}
            closes={chartDisplay.closes}
            range={range}
            onHover={onChartHover}
          />
        )}

        <div className={styles.section}>Retornos</div>
        <div className={styles.returnsGrid}>
          {(returns.length ? returns : Array.from({ length: 6 }, () => null)).map((r, i) =>
            r ? (
              <div key={r.label} className={styles.returnCell}>
                <span className={styles.returnLabel}>{r.label}</span>
                <span className={r.pct == null ? styles.na : r.pct >= 0 ? styles.up : styles.down}>
                  {fmtPct(r.pct)}
                </span>
              </div>
            ) : (
              <div key={i} className={styles.returnCell}>
                <span className={styles.returnLabel}>…</span>
                <span className={styles.na}>—</span>
              </div>
            ),
          )}
        </div>

        <div className={styles.section}>Indicadores</div>
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Fech. anterior</span>
            <span className={styles.statVal}>{fmtMoney(stats?.previousClose, currency)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Mín. do dia</span>
            <span className={styles.statVal}>{fmtMoney(stats?.dayLow, currency)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Máx. do dia</span>
            <span className={styles.statVal}>{fmtMoney(stats?.dayHigh, currency)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Mín. 52 sem</span>
            <span className={styles.statVal}>{fmtMoney(stats?.low52w, currency)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Máx. 52 sem</span>
            <span className={styles.statVal}>{fmtMoney(stats?.high52w, currency)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Dist. da máxima</span>
            <span className={stats?.fromHigh52wPct == null ? styles.na : stats.fromHigh52wPct >= -1 ? styles.up : styles.down}>
              {fmtPct(stats?.fromHigh52wPct)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Volume</span>
            <span className={styles.statVal}>{fmtVolume(stats?.volume ?? null)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Volatilidade (a.a.)</span>
            <span className={styles.statVal}>{fmtPct(stats?.volatilityPct, false)}</span>
          </div>
        </div>

        <p className={styles.disclaimer}>
          Cotações via Yahoo Finance (delay intraday). Atualização automática a cada ~10s com mercado aberto.
          Indicadores calculados sobre o histórico de 12 meses. Conteúdo informativo — não é recomendação de investimento.
        </p>
      </div>
    </div>
  )
}
