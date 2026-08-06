import { formatBRL } from '@/domain/money'
import { annualByMonth, annualSummary } from '@/domain/calc/overview'
import type { Card as CreditCard, Subscription, Transaction } from '@/domain/entities'
import { Card } from '@/components/ui/Card'
import styles from './overview.module.css'

const SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function AnnualView({
  year,
  txs,
  cards,
  subscriptions,
  currentMonth,
}: {
  year: number
  txs: Transaction[]
  cards: CreditCard[]
  subscriptions: Subscription[]
  currentMonth: number
}) {
  const months = annualByMonth(year, txs, cards, subscriptions)
  const summary = annualSummary(months)
  const maxVal = Math.max(...months.map((m) => Number(m.spent)), 1)

  return (
    <Card className={styles.cardFlush}>
      <div className={styles.annualHead}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>📊 Visão anual</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div className="num-lg" style={{ color: 'var(--blue)' }}>
            {formatBRL(summary.totalSpent)}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>gastos em {year}</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.bars}>
          {months.map((m, i) => {
            const pct = Math.max((Number(m.spent) / maxVal) * 100, Number(m.spent) > 0 ? 4 : 0)
            const active = i === currentMonth
            return (
              <div key={i} className={styles.barWrap}>
                <div
                  className={styles.bar}
                  style={{
                    height: `${Math.max(pct, 3)}%`,
                    background: active ? '#60a5fa' : 'color-mix(in srgb, var(--text) 12%, transparent)',
                  }}
                  title={`${SHORT[i]}: ${formatBRL(m.spent)}`}
                />
              </div>
            )
          })}
        </div>
        <div className={styles.barLabels}>
          {SHORT.map((lbl, i) => (
            <div
              key={lbl}
              className={styles.barLbl}
              style={{ color: i === currentMonth ? '#60a5fa' : undefined, fontWeight: i === currentMonth ? 700 : 400 }}
            >
              {lbl}
            </div>
          ))}
        </div>
        <div className="divider" />
        <div className="stat-row">
          <span className="stat-label">💰 Receitas totais</span>
          <span className="stat-val num-green">{formatBRL(summary.totalIncome)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">📉 Gastos totais</span>
          <span className="stat-val num-red">{formatBRL(summary.totalSpent)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">✦ Saldo líquido</span>
          <span className={`stat-val ${summary.balance >= 0 ? 'num-green' : 'num-red'}`}>
            {formatBRL(summary.balance)}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">📅 Média mensal</span>
          <span className="stat-val" style={{ color: '#60a5fa' }}>
            {formatBRL(summary.averageSpent)}
          </span>
        </div>
      </div>
    </Card>
  )
}
