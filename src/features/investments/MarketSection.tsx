import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useQuotes, useRates } from '@/data/useMarket'
import type { Quote } from '@/data/market'
import styles from './MarketSection.module.css'

function formatPrice(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: v >= 1000 ? 0 : 2,
    maximumFractionDigits: v >= 1000 ? 0 : 2,
  })
}

function QuoteRow({ q }: { q: Quote }) {
  const prev = useRef(q.price)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    const previous = prev.current
    prev.current = q.price
    if (q.price === previous) return
    setFlash(q.price > previous ? 'up' : 'down')
    const t = setTimeout(() => setFlash(null), 900)
    return () => clearTimeout(t)
  }, [q.price])

  const up = q.pctChange >= 0
  return (
    <div className={[styles.row, flash ? styles[`flash_${flash}`] : ''].filter(Boolean).join(' ')}>
      <div className={styles.rowInfo}>
        <span className={styles.code}>{q.code}</span>
        <span className={styles.label}>{q.label}</span>
      </div>
      <div className={styles.rowRight}>
        <span className={styles.price}>{formatPrice(q.price)}</span>
        <span className={up ? styles.pctUp : styles.pctDown}>
          {up ? '▲' : '▼'} {Math.abs(q.pctChange).toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

function RateChip({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.rate}>
      <span className={styles.rateLabel}>{label}</span>
      <span className={styles.rateValue}>{(value * 100).toFixed(2).replace('.', ',')}%</span>
    </div>
  )
}

export function MarketSection() {
  const quotes = useQuotes()
  const rates = useRates()

  const list = quotes.data ?? []
  const currencies = list.filter((q) => q.kind === 'currency')
  const crypto = list.filter((q) => q.kind === 'crypto')

  return (
    <>
      {rates.data && (
        <Card
          title="Taxas de referência"
          className={styles.mt}
          action={<span className={styles.source}>Banco Central</span>}
        >
          <div className={styles.rates}>
            <RateChip label="CDI" value={rates.data.cdi} />
            <RateChip label="IPCA (12m)" value={rates.data.ipca} />
            <RateChip label="Selic" value={rates.data.selic} />
          </div>
        </Card>
      )}

      <Card
        title="Mercado ao vivo"
        className={styles.mt}
        action={
          <span className={styles.live}>
            <span className={quotes.isFetching ? `${styles.dot} ${styles.dotPulse}` : styles.dot} />
            {quotes.isFetching ? 'atualizando…' : 'ao vivo'}
          </span>
        }
      >
        {quotes.isLoading ? (
          <p className={styles.muted}>Carregando cotações…</p>
        ) : quotes.isError ? (
          <p className={styles.muted}>Não foi possível carregar o mercado agora.</p>
        ) : (
          <div className={styles.cols}>
            <div className={styles.col}>
              <span className={styles.colTitle}>💵 Câmbio</span>
              {currencies.map((q) => (
                <QuoteRow key={q.code} q={q} />
              ))}
            </div>
            <div className={styles.col}>
              <span className={styles.colTitle}>₿ Cripto</span>
              {crypto.map((q) => (
                <QuoteRow key={q.code} q={q} />
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  )
}
