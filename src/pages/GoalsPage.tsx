import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { HeaderActionButton } from '@/components/legacy/HeaderActionButton'
import { GoalModal } from '@/features/goals/GoalModal'
import { GoalDepositModal } from '@/features/goals/GoalDepositModal'
import { useGoalMutations } from '@/features/goals/useGoalMutations'
import { formatBRL } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import { goalProgress } from '@/domain/calc/goals'
import { formatDate } from '@/lib/format'
import type { Goal } from '@/domain/entities'

export function GoalsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const { save, remove, transact } = useGoalMutations(user?.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null)

  if (isLoading) return <PageHeader title="Metas" subtitle="Carregando…" />
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Metas" />
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Não foi possível carregar suas metas.</p>
        </div>
      </>
    )
  }

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Metas"
        subtitle="Seu progresso financeiro"
        action={<HeaderActionButton onClick={openNew}>＋ Nova</HeaderActionButton>}
      />

      {data.goals.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Nenhuma meta ainda. Crie uma (viagem, reserva, um sonho) e acompanhe o progresso a cada depósito.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.goals.map((g) => {
            const { pct, remaining } = goalProgress(g)
            const done = remaining <= 0
            return (
              <div key={g.id} className="card fadein">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    className="tx-ico"
                    style={{ background: `${g.color}22`, border: `1px solid ${g.color}40`, width: 44, height: 44 }}
                  >
                    {g.icon}
                  </div>
                  <div className="tx-info">
                    <button
                      type="button"
                      className="tx-name"
                      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}
                      onClick={() => {
                        setEditing(g)
                        setModalOpen(true)
                      }}
                    >
                      {g.name} ✏️
                    </button>
                    <div className="tx-meta">
                      {formatBRL(g.saved)} de {formatBRL(g.target)}
                      {g.deadline && ` · até ${formatDate(g.deadline)}`}
                    </div>
                  </div>
                  <div
                    className="num-md"
                    style={{ color: done ? 'var(--green)' : g.color, flexShrink: 0 }}
                  >
                    {Math.round(pct)}%
                  </div>
                </div>
                <div className="prog" style={{ height: 7, marginBottom: 12 }}>
                  <div
                    className="prog-fill"
                    style={{ width: `${pct}%`, background: done ? 'var(--green)' : g.color }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  {done ? (
                    <span style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>🎉 Concluída</span>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>faltam {formatBRL(remaining)}</span>
                  )}
                  <Button variant="ghost" onClick={() => setDepositGoal(g)}>
                    Depositar / retirar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <GoalModal
        open={modalOpen}
        editing={editing}
        saving={save.isPending || remove.isPending}
        onClose={() => setModalOpen(false)}
        onSave={async (draft) => {
          await save.mutateAsync(draft)
          setModalOpen(false)
        }}
        onDelete={async (id) => {
          await remove.mutateAsync(id)
          setModalOpen(false)
        }}
      />

      <GoalDepositModal
        open={depositGoal !== null}
        goal={depositGoal}
        accounts={data.bankAccounts}
        saving={transact.isPending}
        onClose={() => setDepositGoal(null)}
        onConfirm={async ({ amount, mode, accountId }) => {
          if (!depositGoal) return
          await transact.mutateAsync({
            goal: depositGoal,
            amount,
            mode,
            date: toISODate(new Date()),
            accountId,
          })
          setDepositGoal(null)
        }}
      />
    </>
  )
}
