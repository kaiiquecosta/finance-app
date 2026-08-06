import { formatBRL, sum } from '@/domain/money'
import type { FixedBill } from '@/domain/entities'
import { nextMonthWindow } from './upcomingBillsLogic'
import styles from './overview.module.css'

export function UpcomingBills({
  bills,
  asOf,
  onAdd,
}: {
  bills: FixedBill[]
  asOf: Date
  onAdd: () => void
}) {
  if (!bills.length) {
    return (
      <p style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 0' }}>
        Nenhuma conta fixa cadastrada.{' '}
        <button type="button" className="card-link" onClick={onAdd} style={{ marginLeft: 4 }}>
          Adicionar →
        </button>
      </p>
    )
  }

  const m = nextMonthWindow(asOf)
  const total = sum(bills.map((b) => b.amt))

  return (
    <div data-testid="overview-upcoming-bills">
      <div className={styles.upcomingTitle} data-testid="overview-upcoming-month">
        <span>📅 {m.label}</span>
        <span style={{ color: 'var(--muted)', fontFamily: 'var(--num)' }}>{formatBRL(total)}</span>
      </div>
      {bills.map((b) => (
        <div key={b.id} className={styles.upcomingRow}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: 'grid',
              placeItems: 'center',
              fontSize: 16,
              background: 'var(--raise, color-mix(in srgb, var(--text) 4%, transparent))',
              border: '1px solid var(--border)',
            }}
          >
            {b.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{b.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>dia {b.dueDay}</div>
          </div>
          <div style={{ fontFamily: 'var(--num)', fontWeight: 600, color: 'var(--red)' }}>
            {formatBRL(b.amt)}
          </div>
        </div>
      ))}
    </div>
  )
}
