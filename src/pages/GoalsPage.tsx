import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProGate } from '@/features/billing/ProGate'
import { GoalModal } from '@/features/goals/GoalModal'
import { GoalDepositModal } from '@/features/goals/GoalDepositModal'
import { useGoalMutations } from '@/features/goals/useGoalMutations'
import { formatBRL } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import { goalProgress } from '@/domain/calc/goals'
import { formatDate } from '@/lib/format'
import type { Goal } from '@/domain/entities'
import styles from './GoalsPage.module.css'

export function GoalsPage() {
  return (
    <ProGate
      feature="Metas"
      icon="🎯"
      description="Crie metas com prazo e valor alvo, e acompanhe o progresso a cada depósito ou retirada."
    >
      <GoalsPageContent />
    </ProGate>
  )
}

function GoalsPageContent() {
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
        <Card>
          <p className={styles.muted}>Não foi possível carregar suas metas.</p>
        </Card>
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
        subtitle="Seus objetivos financeiros"
        action={<Button onClick={openNew}>＋ Nova meta</Button>}
      />

      {data.goals.length === 0 ? (
        <Card>
          <p className={styles.muted}>
            Nenhuma meta ainda. Crie uma (viagem, reserva, um sonho) e acompanhe o progresso a cada
            depósito.
          </p>
        </Card>
      ) : (
        <div className={styles.grid}>
          {data.goals.map((g) => {
            const { pct, remaining } = goalProgress(g)
            const done = remaining <= 0
            return (
              <Card key={g.id} className={styles.goal}>
                <div className={styles.top}>
                  <span className={styles.icon} style={{ background: `${g.color}22` }}>
                    {g.icon}
                  </span>
                  <div className={styles.info}>
                    <button className={styles.name} onClick={() => {
                      setEditing(g)
                      setModalOpen(true)
                    }}>
                      {g.name} ✏️
                    </button>
                    <span className={styles.sub}>
                      {formatBRL(g.saved)} de {formatBRL(g.target)}
                      {g.deadline && ` · até ${formatDate(g.deadline)}`}
                    </span>
                  </div>
                  <span className={done ? styles.pctDone : styles.pct}>{Math.round(pct)}%</span>
                </div>

                <div className={styles.bar}>
                  <div
                    className={styles.fill}
                    style={{ width: `${pct}%`, background: done ? 'var(--green)' : g.color }}
                  />
                </div>

                <div className={styles.actions}>
                  {done ? (
                    <span className={styles.doneLabel}>🎉 Concluída</span>
                  ) : (
                    <span className={styles.remaining}>faltam {formatBRL(remaining)}</span>
                  )}
                  <Button variant="ghost" onClick={() => setDepositGoal(g)}>
                    Depositar / retirar
                  </Button>
                </div>
              </Card>
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
