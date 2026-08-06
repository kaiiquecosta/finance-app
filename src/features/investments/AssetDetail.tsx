import { useMemo, useState } from 'react'
import { useChartSeries, useYearSeries } from '@/data/useMarketChart'
import { RANGE_OPTIONS, assetStats, periodReturns, type ChartRange } from '@/data/marketChart'
import { stockByYahoo } from '@/data/stocksCatalog'
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

function BigChart({ timestamps, closes, range }: { timestamps: number[]; closes: number[]; range: ChartRange }) {
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
    <div>
      <svg className={styles.chart} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="assetFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#assetFill)" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
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
  const chart = useChartSeries(symbol, range)
  const year = useYearSeries(symbol)

  const def = stockByYahoo(symbol)
  const meta = chart.data?.meta ?? year.data?.meta
  const currency = meta?.currency ?? def?.currency ?? 'BRL'
  const displayName = def?.name ?? meta?.longName ?? meta?.shortName ?? symbol
  const exchange = def?.exchange ?? meta?.fullExchangeName ?? meta?.exchangeName ?? ''

  const stats = useMemo(() => (year.data ? assetStats(year.data) : null), [year.data])
  const returns = useMemo(
    () => (year.data ? periodReturns(year.data.timestamps, year.data.closes) : []),
    [year.data],
  )

  const price = stats?.price ?? meta?.regularMarketPrice ?? null
  const dayPct = stats?.dayChangePct ?? null
  const up = (dayPct ?? 0) >= 0

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
          <span className={styles.price}>{fmtMoney(price, currency)}</span>
          <span className={up ? styles.up : styles.down}>
            {dayPct == null ? '' : `${up ? '▲' : '▼'} ${Math.abs(dayPct).toFixed(2).replace('.', ',')}% hoje`}
          </span>
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
        {chart.data && <BigChart timestamps={chart.data.timestamps} closes={chart.data.closes} range={range} />}

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
          Dados via Yahoo Finance (podem ter atraso). Indicadores calculados sobre o histórico de 12 meses.
          Conteúdo informativo — não é recomendação de investimento.
        </p>
      </div>
    </div>
  )
}
