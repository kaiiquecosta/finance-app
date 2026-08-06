import { formatBRL } from '@/domain/money'
import { availableLimit, totalAvailableLimit } from '@/domain/calc/cards'
import type { Card } from '@/domain/entities'
import styles from './overview.module.css'

export function CreditLimit({ cards, asOf }: { cards: Card[]; asOf: Date }) {
  const total = totalAvailableLimit(cards, asOf)
  const creditCards = cards.filter((c) => c.type === 'credito')

  return (
    <>
      <div className="num-lg num-green">{formatBRL(total)}</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>disponível</div>
      <div className="divider" />
      {creditCards.length === 0 ? (
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>Nenhum cartão cadastrado</span>
      ) : (
        creditCards.map((c) => (
          <div key={c.id} className={styles.miniRow}>
            <span className={styles.dot} style={{ background: c.color }} />
            <span className={styles.miniName}>{c.name}</span>
            <span className={`${styles.miniVal} num-green`}>{formatBRL(availableLimit(c, asOf))}</span>
          </div>
        ))
      )}
    </>
  )
}
