import { useMemo } from 'react'
import { AssetMark } from '@/components/assets/AssetMark'
import type { StockQuote } from '@/data/marketSpark'
import { stockByYahoo } from '@/data/stocksCatalog'
import styles from './MarketMovers.module.css'

type MoverRow = { quote: StockQuote; def: NonNullable<ReturnType<typeof stockByYahoo>> }

function formatPrice(q: StockQuote): string {
  const locale = q.currency === 'BRL' ? 'pt-BR' : 'en-US'
  return q.price.toLocaleString(locale, {
    style: 'currency',
    currency: q.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function MoverList({
  title,
  icon,
  rows,
  onOpen,
}: {
  title: string
  icon: string
  rows: MoverRow[]
  onOpen?: (yahoo: string) => void
}) {
  return (
    <div className={styles.col}>
      <h4 className={styles.title}>
        {title} <span aria-hidden>{icon}</span>
      </h4>
      {rows.length === 0 ? (
        <p className={styles.empty}>Sem movimentos hoje.</p>
      ) : (
        rows.map(({ quote, def }) => {
          const up = quote.pctChange >= 0
          const body = (
            <>
              <AssetMark def={def} size="sm" />
              <span className={styles.sym}>{def.symbol}</span>
              <span className={up ? styles.up : styles.down}>
                {up ? '+' : ''}
                {quote.pctChange.toFixed(2).replace('.', ',')}%
              </span>
              <span className={styles.price}>{formatPrice(quote)}</span>
            </>
          )
          return onOpen ? (
            <button key={quote.yahoo} type="button" className={styles.row} onClick={() => onOpen(def.yahoo)}>
              {body}
            </button>
          ) : (
            <div key={quote.yahoo} className={styles.rowStatic}>
              {body}
            </div>
          )
        })
      )}
    </div>
  )
}

export function MarketMovers({
  quotes,
  limit = 6,
  onOpen,
}: {
  quotes: StockQuote[]
  limit?: number
  onOpen?: (yahoo: string) => void
}) {
  const { gainers, losers } = useMemo(() => {
    const rows: MoverRow[] = []
    for (const quote of quotes) {
      const def = stockByYahoo(quote.yahoo)
      if (!def) continue
      rows.push({ quote, def })
    }
    const gainers = rows
      .filter((r) => r.quote.pctChange > 0)
      .sort((a, b) => b.quote.pctChange - a.quote.pctChange)
      .slice(0, limit)
    const losers = rows
      .filter((r) => r.quote.pctChange < 0)
      .sort((a, b) => a.quote.pctChange - b.quote.pctChange)
      .slice(0, limit)
    return { gainers, losers }
  }, [quotes, limit])

  if (!gainers.length && !losers.length) return null

  return (
    <div className={styles.wrap}>
      <MoverList title="Maiores Altas" icon="▲" rows={gainers} onOpen={onOpen} />
      <MoverList title="Maiores Baixas" icon="▼" rows={losers} onOpen={onOpen} />
    </div>
  )
}
