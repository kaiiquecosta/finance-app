import { formatBRL, type Cents } from '@/domain/money'
import { iconFor } from '@/domain/categories'
import {
  insightMessage,
  spendVariation,
  summarizeTransactions,
  topCategory,
} from '@/domain/calc/overview'
import type { Transaction } from '@/domain/entities'
import styles from './overview.module.css'

interface Props {
  monthTxs: Transaction[]
  prevMonthTxs: Transaction[]
  byCat: Record<string, Cents>
  categoryLabel?: (cat: string) => string
}

export function HeroInsight({ monthTxs, prevMonthTxs, byCat, categoryLabel = (c) => c }: Props) {
  const spent = summarizeTransactions(monthTxs).spent
  const prevSpent = summarizeTransactions(prevMonthTxs).spent
  const variation = spendVariation(spent, prevSpent)
  const top = topCategory(byCat)
  const rounded = Math.round(variation)
  const hasPrev = prevSpent > 0

  return (
    <div className={styles.overviewHero}>
      <div className={styles.kicker}>Vamos descobrir para onde seu dinheiro está indo?</div>
      <div className={styles.insight}>{insightMessage(top, variation)}</div>
      <div className={styles.metrics}>
        <div>
          <div className={styles.metricLabel}>Gasto do mês</div>
          <div className="num-md">{formatBRL(spent)}</div>
        </div>
        <div>
          <div className={styles.metricLabel}>vs. mês anterior</div>
          <div className={`num-md ${variation > 0 ? 'num-red' : 'num-green'}`}>
            {hasPrev ? `${rounded >= 0 ? '↑' : '↓'} ${Math.abs(rounded)}%` : '—'}
          </div>
        </div>
        <div>
          <div className={styles.metricLabel}>Maior gasto</div>
          <div className="num-md">{top ? `${iconFor(top.category)} ${categoryLabel(top.category)}` : '—'}</div>
        </div>
      </div>
    </div>
  )
}
