import { formatBRL } from '@/domain/money'
import { receiptStatus, totalMonthlyExpected, totalReceived } from '@/domain/calc/income'
import type { Income } from '@/domain/entities'

export function IncomeList({
  incomes,
  asOf,
  onEdit,
}: {
  incomes: Income[]
  asOf: Date
  onEdit: (inc: Income) => void
}) {
  const expected = totalMonthlyExpected(incomes)
  const received = totalReceived(incomes, asOf)

  return (
    <>
      {incomes.map((inc) => {
        const status = receiptStatus(inc, asOf)
        return (
          <button
            key={inc.id}
            type="button"
            onClick={() => onEdit(inc)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '10px 0',
              border: 'none',
              background: 'none',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 22 }}>{inc.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{inc.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {inc.freq}
                {inc.days.length > 0 && ` · dia ${inc.days.join(', ')}`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num-green" style={{ fontFamily: 'var(--num)', fontWeight: 700 }}>
                {formatBRL(inc.amt)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {status === 'full' ? '✓ recebido' : status === 'partial' ? 'parcial' : 'a receber'}
              </div>
            </div>
          </button>
        )
      })}
      <div
        style={{
          paddingTop: 12,
          marginTop: 4,
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="stat-row">
          <span className="stat-label">Total mensal previsto</span>
          <span className="stat-val num-green">{formatBRL(expected)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Recebido este mês</span>
          <span className="stat-val">{formatBRL(received)}</span>
        </div>
      </div>
    </>
  )
}
