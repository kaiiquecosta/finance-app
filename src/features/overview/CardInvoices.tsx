import { formatBRL, sum, type Cents } from '@/domain/money'
import { getInvoiceMonth, invoiceTotal } from '@/domain/calc/cards'
import type { Card, Subscription } from '@/domain/entities'
import styles from './overview.module.css'

/** Fatura(s) de cartão + assinaturas — bloco vermelho da Visão geral. */
export function CardInvoices({
  cards,
  subscriptions,
  asOf,
  onSeeBills,
}: {
  cards: Card[]
  subscriptions: Subscription[]
  asOf: Date
  onSeeBills: () => void
}) {
  let grandTotal = 0 as number
  const rows: { key: string; name: string; color: string; amt: Cents }[] = []

  for (const card of cards) {
    let fat = 0
    for (let off = 0; off <= 2; off++) {
      const { month, year } = getInvoiceMonth(off, asOf)
      const f = invoiceTotal(card, month, year)
      if (f > 0) {
        fat = Number(f)
        break
      }
    }
    if (fat <= 0) continue
    grandTotal += fat
    rows.push({
      key: String(card.id),
      name: card.name,
      color: card.color,
      amt: fat as Cents,
    })
  }

  const subTotal = sum(subscriptions.map((s) => s.amt))
  if (subTotal > 0) grandTotal += Number(subTotal)

  if (grandTotal <= 0) return null

  return (
    <div
      className="card"
      style={{
        marginBottom: 16,
        borderColor: 'color-mix(in srgb, var(--red) 25%, transparent)',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--red) 5%, transparent) 0%, transparent 60%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>💳</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Fatura do cartão</span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>este mês</span>
        </div>
        <button type="button" className="card-link" onClick={onSeeBills}>
          pagar → Contas fixas
        </button>
      </div>
      {rows.map((r) => (
        <div key={r.key} className={styles.miniRow}>
          <span className={styles.dot} style={{ background: r.color }} />
          <span className={styles.miniName}>{r.name}</span>
          <span className={`${styles.miniVal} num-red`}>{formatBRL(r.amt)}</span>
        </div>
      ))}
      {subTotal > 0 && (
        <div className={styles.miniRow}>
          <span>🔁</span>
          <span className={styles.miniName} style={{ color: 'var(--muted)', fontSize: 12 }}>
            Assinaturas ({subscriptions.length})
          </span>
          <span className={`${styles.miniVal} num-red`}>{formatBRL(subTotal)}</span>
        </div>
      )}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          marginTop: 10,
          paddingTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>Total das faturas</span>
        <span className="num-red" style={{ fontFamily: 'var(--num)', fontWeight: 800, fontSize: 16 }}>
          {formatBRL(grandTotal as Cents)}
        </span>
      </div>
    </div>
  )
}
