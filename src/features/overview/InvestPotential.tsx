import { formatBRL } from '@/domain/money'
import {
  fixedBillsTotal,
  futureValue,
  investmentAverages,
  monthlyPotential,
  POTENTIAL_SCENARIOS,
} from '@/domain/calc/overview'
import type { FixedBill, Transaction } from '@/domain/entities'
import { Card } from '@/components/ui/Card'
import styles from './overview.module.css'

export function InvestPotential({
  year,
  txs,
  fixedBills,
}: {
  year: number
  txs: Transaction[]
  fixedBills: FixedBill[]
}) {
  const { avgIncome, avgSpent } = investmentAverages(year, txs)
  const fixed = fixedBillsTotal(fixedBills)
  const potential = monthlyPotential(avgIncome, avgSpent, fixed)

  return (
    <Card className={styles.cardFlush}>
      <div className={styles.investHead}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>🌱 Potencial de investimento</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div className="num-lg num-green">{formatBRL(potential)}</div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>disponível/mês</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className="divider" />
        <div
          style={{
            color: 'var(--muted)',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.07,
            marginBottom: 10,
          }}
        >
          Se investir o potencial mensal
        </div>
        {potential <= 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Reduza gastos para liberar potencial.</p>
        ) : (
          POTENTIAL_SCENARIOS.map((s, i) => {
            const fv = futureValue(potential, s.months, s.rate)
            return (
              <div key={s.label} className={`${styles.scenario} ${i === 1 ? styles.scenarioHi : ''}`}>
                <span>
                  {s.label}{' '}
                  <span style={{ fontSize: 10, opacity: 0.6 }}>~{(s.rate * 100).toFixed(1)}%/mês</span>
                </span>
                <span className={i === 1 ? 'num-green' : ''} style={{ fontFamily: 'var(--num)', fontWeight: 700 }}>
                  {formatBRL(fv)}
                </span>
              </div>
            )
          })
        )}
        <div className="divider" />
        <div
          style={{
            color: 'var(--muted)',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.07,
            marginBottom: 10,
          }}
        >
          Como foi calculado
        </div>
        <div className="stat-row">
          <span className="stat-label">💵 Receita média</span>
          <span className="stat-val num-green">{formatBRL(avgIncome)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">📉 Gasto médio</span>
          <span className="stat-val num-red">{formatBRL(avgSpent)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">🏠 Contas fixas</span>
          <span className="stat-val num-red">{formatBRL(fixed)}</span>
        </div>
        <div className="stat-row" style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          <span className="stat-label" style={{ fontWeight: 600 }}>
            🌱 Potencial
          </span>
          <span className="stat-val num-green" style={{ fontWeight: 700 }}>
            {formatBRL(potential)}
          </span>
        </div>
      </div>
    </Card>
  )
}
