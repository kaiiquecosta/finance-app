import { useMemo, useState } from 'react'
import { useStockQuotes } from '@/data/useStockQuotes'
import type { StockQuote } from '@/data/marketSpark'
import styles from './InvestorHub.module.css'

type Filter = 'all' | 'us' | 'br' | 'tech'

function formatPrice(q: StockQuote): string {
  const opts: Intl.NumberFormatOptions =
    q.currency === 'BRL'
      ? { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }
  return q.price.toLocaleString('pt-BR', opts)
}

function MiniSpark({ values }: { values: number[] }) {
  if (values.length < 2) return <div className={styles.sparkEmpty} />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const w = 56
  const h = 22
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * h
      return `${x},${y}`
    })
    .join(' ')
  const up = values[values.length - 1] >= values[0]
  return (
    <svg className={styles.spark} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={pts} fill="none" stroke={up ? 'var(--green)' : 'var(--red)'} strokeWidth="1.5" />
    </svg>
  )
}

function marketSessionLabel(): { label: string; open: boolean } {
  const now = new Date()
  const h = now.getHours()
  const wd = now.getDay()
  const brOpen = h >= 10 && h < 18 && wd >= 1 && wd <= 5
  return { label: brOpen ? 'Mercado aberto' : 'Mercado fechado', open: brOpen }
}

export function InvestorHub() {
  const stocks = useStockQuotes()
  const [filter, setFilter] = useState<Filter>('all')
  const session = marketSessionLabel()

  const list = useMemo(() => {
    const raw = stocks.data ?? []
    if (filter === 'all') return raw
    if (filter === 'us') return raw.filter((q) => q.region === 'us')
    if (filter === 'br') return raw.filter((q) => q.region === 'br')
    return raw.filter((q) => q.region === 'us' && US_TECH.has(q.symbol))
  }, [stocks.data, filter])

  const tape = (stocks.data ?? []).slice(0, 12)
  const heroes = (stocks.data ?? []).slice(0, 3)

  return (
    <div className={styles.wrap}>
      <div className={styles.heroBar}>
        <div>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>📈</span>
            <div>
              <div className={styles.brandTitle}>Investidor</div>
              <div className={styles.brandSub}>Painel ao vivo · estilo corretora</div>
            </div>
          </div>
        </div>
        <div className={styles.heroRight}>
          <span className={[styles.session, session.open ? styles.sessionOpen : ''].filter(Boolean).join(' ')}>
            {session.label}
          </span>
          <span className={styles.live}>
            <span className={stocks.isFetching ? styles.dotPulse : styles.dot} />
            {stocks.isFetching ? 'atualizando…' : 'tempo real · ~30s'}
          </span>
        </div>
      </div>

      {tape.length > 0 && (
        <div className={styles.tickerWrap} aria-label="Ticker de cotações">
          <div className={styles.tickerTrack}>
            {[...tape, ...tape].map((q, i) => (
              <span key={`${q.symbol}-${i}`} className={styles.tickerItem}>
                <span className={styles.tickerSym}>{q.icon} {q.symbol}</span>
                <span className={styles.tickerPx}>{formatPrice(q)}</span>
                <span className={q.pctChange >= 0 ? styles.up : styles.down}>
                  {q.pctChange >= 0 ? '+' : ''}
                  {q.pctChange.toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {heroes.length > 0 && (
        <div className={styles.featureGrid}>
          {heroes.map((q) => (
            <div key={q.symbol} className={styles.featureCard}>
              <div className={styles.featureTop}>
                <span className={styles.featureIcon}>{q.icon}</span>
                <div>
                  <div className={styles.featureName}>{q.name}</div>
                  <div className={styles.featureMeta}>
                    {q.symbol} · {q.exchange}
                  </div>
                </div>
              </div>
              <div className={styles.featurePrice}>{formatPrice(q)}</div>
              <div className={q.pctChange >= 0 ? styles.up : styles.down}>
                {q.pctChange >= 0 ? '▲' : '▼'} {Math.abs(q.pctChange).toFixed(2)}% hoje
              </div>
              <MiniSpark values={q.sparkline} />
            </div>
          ))}
        </div>
      )}

      <div className={styles.filters}>
        {(
          [
            ['all', 'Todos'],
            ['us', '🇺🇸 EUA'],
            ['br', '🇧🇷 Brasil'],
            ['tech', 'Tech / hype'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={[styles.filterBtn, filter === id ? styles.filterActive : ''].filter(Boolean).join(' ')}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHead}>
          <span>Ativo</span>
          <span>Preço</span>
          <span>Var. dia</span>
          <span className={styles.colSpark}>Intraday</span>
        </div>

        {stocks.isLoading && <p className={styles.muted}>Carregando cotações…</p>}
        {stocks.isError && (
          <p className={styles.muted}>Não foi possível carregar as ações agora. Tente atualizar a página.</p>
        )}

        {!stocks.isLoading &&
          !stocks.isError &&
          list.map((q) => (
            <div key={q.yahoo} className={styles.tableRow}>
              <div className={styles.assetCell}>
                <span className={styles.assetIcon}>{q.icon}</span>
                <div>
                  <div className={styles.assetName}>{q.name}</div>
                  <div className={styles.assetSub}>
                    {q.symbol} · {q.exchange}
                  </div>
                </div>
              </div>
              <span className={styles.priceCell}>{formatPrice(q)}</span>
              <span className={q.pctChange >= 0 ? styles.up : styles.down}>
                {q.pctChange >= 0 ? '+' : ''}
                {q.pctChange.toFixed(2)}%
              </span>
              <MiniSpark values={q.sparkline} />
            </div>
          ))}
      </div>

      <p className={styles.disclaimer}>
        Cotações via Yahoo Finance (delay intraday). Não é recomendação de investimento — use como referência
        visual dentro do Flux.
      </p>
    </div>
  )
}

const US_TECH = new Set(['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'TSLA', 'AMD', 'AVGO', 'NFLX', 'COIN', 'PLTR', 'SMCI'])
