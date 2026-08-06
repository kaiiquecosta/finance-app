import { formatBRL } from '@/domain/money'
import { monthKey, receiptKey, receiptStatus, totalMonthlyExpected, totalReceived } from '@/domain/calc/income'
import type { Income } from '@/domain/entities'
import styles from './IncomeList.module.css'

function dayBadgeLabel(day: number, diff: number): string {
  if (diff < 0) return `⚠️ dia ${day} pendente`
  if (diff === 0) return '💰 Receber hoje'
  if (diff === 1) return '💰 Amanhã'
  return `🕐 dia ${day} a receber`
}

function dayBadgeClass(diff: number, received: boolean): string {
  if (received) return `${styles.dayBadge} ${styles.dayReceived}`
  if (diff < 0) return `${styles.dayBadge} ${styles.dayOverdue}`
  if (diff === 0) return `${styles.dayBadge} ${styles.dayToday}`
  if (diff === 1) return `${styles.dayBadge} ${styles.daySoon}`
  return `${styles.dayBadge} ${styles.dayPending}`
}

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
  const today = asOf.getDate()
  const mk = monthKey(asOf)

  return (
    <>
      {incomes.map((inc) => {
        const status = receiptStatus(inc, asOf)
        return (
          <button key={inc.id} type="button" className={styles.row} onClick={() => onEdit(inc)}>
            <span className={styles.icon}>{inc.icon}</span>
            <div className={styles.main}>
              <div className={styles.name}>{inc.name}</div>
              <div className={styles.meta}>
                {inc.freq}
                {inc.days.length > 0 && ` · dia ${inc.days.join(', ')}`}
              </div>
            </div>
            <div className={styles.amountCol}>
              <div className={`num-green ${styles.amount}`}>{formatBRL(inc.amt)}</div>
              {inc.days.length > 0 ? (
                <div className={styles.dayBadges}>
                  {inc.days.map((d) => {
                    const key = receiptKey(mk, d)
                    const got = inc.received.includes(key)
                    const diff = d - today
                    return (
                      <span key={d} className={dayBadgeClass(diff, got)}>
                        {got ? `✓ dia ${d} recebido` : dayBadgeLabel(d, diff)}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <div className={styles.statusMuted}>
                  {status === 'full' ? '✓ recebido' : status === 'partial' ? 'parcial' : 'a receber'}
                </div>
              )}
            </div>
          </button>
        )
      })}
      <div className={styles.totals}>
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
