import { formatBRL } from '@/domain/money'
import { goalProgress } from '@/domain/calc/goals'
import type { Goal } from '@/domain/entities'
import { Card } from '@/components/ui/Card'
import { formatPercent } from '@/lib/format'

export function OverviewGoalsSnapshot({
  goals,
  onSeeAll,
  onAdd,
}: {
  goals: Goal[]
  onSeeAll: () => void
  onAdd: () => void
}) {
  const list = goals.slice(0, 4)

  return (
    <Card
      title="🎯 Metas"
      action={
        <button type="button" className="card-link" onClick={onSeeAll}>
          ver todas →
        </button>
      }
    >
      {list.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Nenhuma meta ainda.{' '}
          <button type="button" className="card-link" onClick={onAdd}>
            Criar →
          </button>
        </p>
      ) : (
        list.map((g) => {
          const { pct, remaining } = goalProgress(g)
          return (
            <div
              key={g.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                  background: `${g.color}22`,
                  border: `1px solid ${g.color}44`,
                }}
              >
                {g.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Faltam {formatBRL(remaining)}
                </div>
                <div className="prog" style={{ marginTop: 6 }}>
                  <div className="prog-fill" style={{ width: `${pct}%`, background: g.color }} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--num)', fontWeight: 700, color: g.color }}>{formatPercent(pct)}</div>
            </div>
          )
        })
      )}
    </Card>
  )
}
