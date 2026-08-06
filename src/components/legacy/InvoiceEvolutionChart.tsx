import type { Card } from '@/domain/entities'
import { formatBRL, sum, type Cents } from '@/domain/money'
import { getInvoiceMonth, invoiceTotal } from '@/domain/calc/cards'
import { MONTHS } from '@/domain/categories'

type Props = {
  cards: Card[]
  monthOffset: number
  asOf?: Date
  onSelectOffset: (offset: number) => void
}

function chartBarInactive(): string {
  return 'rgba(100, 116, 139, 0.35)'
}

export function InvoiceEvolutionChart({ cards, monthOffset, asOf = new Date(), onSelectOffset }: Props) {
  const slots: { offset: number; isCur: boolean; month: number }[] = []
  for (let i = -4; i <= 1; i++) {
    const { month } = getInvoiceMonth(monthOffset + i, asOf)
    slots.push({ offset: monthOffset + i, isCur: i === 0, month })
  }

  const vals: Cents[] = slots.map(({ offset }) => {
    const { month, year } = getInvoiceMonth(offset, asOf)
    return sum(cards.map((c) => invoiceTotal(c, month, year)))
  })
  const maxV = Math.max(...vals.map((v) => v as number), 1)

  return (
    <div>
      <div className="chart-wrap">
        {slots.map(({ offset, isCur }, i) => {
          const v = vals[i]
          const pct = Math.max(((v as number) / maxV) * 100, v > 0 ? 3 : 0)
          return (
            <button
              key={offset}
              type="button"
              className="chart-bar-wrap"
              title={`${MONTHS[slots[i].month]}: ${formatBRL(v)}`}
              onClick={() => onSelectOffset(offset)}
            >
              <div
                className="chart-bar"
                style={{
                  height: `${Math.max(pct, 3)}%`,
                  background: isCur ? 'var(--green)' : chartBarInactive(),
                }}
              />
            </button>
          )
        })}
      </div>
      <div className="chart-labels">
        {slots.map(({ offset, isCur, month }) => (
          <button
            key={`lbl-${offset}`}
            type="button"
            className={['chart-lbl', isCur ? 'cur' : ''].filter(Boolean).join(' ')}
            onClick={() => onSelectOffset(offset)}
          >
            {MONTHS[month]}
          </button>
        ))}
      </div>
    </div>
  )
}
