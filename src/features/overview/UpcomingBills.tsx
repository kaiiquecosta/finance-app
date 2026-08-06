import { formatBRL, sum } from '@/domain/money'
import type { FixedBill } from '@/domain/entities'
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

  const months = [0, 1, 2].map((offset) => {
    const d = new Date(asOf.getFullYear(), asOf.getMonth() + offset, 1)
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      isCurrent: offset === 0,
    }
  })

  return (
    <>
      {months.map((m, mi) => {
        const pending = bills.filter((b) => (m.isCurrent ? !b.paid : true))
        const total = sum(pending.map((b) => b.amt))
        return (
          <div key={`${m.year}-${m.month}`}>
            <div className={styles.upcomingTitle}>
              <span>
                {m.isCurrent ? '📍 ' : ''}
                {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
              </span>
              <span
                style={{
                  color: m.isCurrent ? 'var(--amber)' : 'var(--muted)',
                  fontFamily: 'var(--num)',
                }}
              >
                {formatBRL(total)}
              </span>
            </div>
            {pending.map((b) => {
              const paid = m.isCurrent && b.paid
              return (
                <div key={b.id} className={styles.upcomingRow}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 16,
                      background: paid
                        ? 'color-mix(in srgb, var(--green) 10%, transparent)'
                        : 'var(--raise, color-mix(in srgb, var(--text) 4%, transparent))',
                      border: `1px solid ${paid ? 'color-mix(in srgb, var(--green) 20%, transparent)' : 'var(--border)'}`,
                    }}
                  >
                    {b.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        textDecoration: paid ? 'line-through' : undefined,
                        color: paid ? 'var(--muted)' : 'var(--text)',
                      }}
                    >
                      {b.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>dia {b.dueDay}</div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--num)',
                      fontWeight: 600,
                      color: paid ? 'var(--green)' : 'var(--red)',
                    }}
                  >
                    {paid ? '✓ pago' : formatBRL(b.amt)}
                  </div>
                </div>
              )
            })}
            {mi < 2 && <div className="divider" />}
          </div>
        )
      })}
    </>
  )
}
