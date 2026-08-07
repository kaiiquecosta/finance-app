import { useMemo, useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { HeaderActionButton } from '@/components/legacy/HeaderActionButton'
import { GoalModal } from '@/features/goals/GoalModal'
import { GoalDepositModal } from '@/features/goals/GoalDepositModal'
import { useGoalMutations } from '@/features/goals/useGoalMutations'
import { formatBRL, sum, type Cents } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import { goalProgress } from '@/domain/calc/goals'
import { formatDate, formatPercent } from '@/lib/format'
import type { Goal } from '@/domain/entities'
import styles from './GoalsPage.module.css'

function daysUntilDeadline(deadline: string | null | undefined, asOf = new Date()): number | null {
  if (!deadline) return null
  const end = new Date(deadline)
  if (Number.isNaN(end.getTime())) return null
  const start = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.ceil((endDay.getTime() - start.getTime()) / 86_400_000)
}

export function GoalsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const { save, remove, transact } = useGoalMutations(user?.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null)

  const summary = useMemo(() => {
    if (!data?.goals.length) return null
    const totalSaved = sum(data.goals.map((g) => g.saved))
    const totalTarget = sum(data.goals.map((g) => g.target))
    const completed = data.goals.filter((g) => goalProgress(g).remaining <= 0).length
    const overallPct =
      totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0
    return { totalSaved, totalTarget, completed, overallPct, count: data.goals.length }
  }, [data?.goals])

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

  const openEdit = (g: Goal) => {
    setEditing(g)
    setModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Metas"
        subtitle="Seu progresso financeiro"
        action={<HeaderActionButton onClick={openNew}>＋ Nova</HeaderActionButton>}
      />

      <div className={styles.page}>
        {summary && (
          <section className={styles.hero} aria-label="Resumo das metas">
            <div className={styles.heroStat}>
              <div>
                <div className={styles.heroLabel}>Guardado</div>
                <div className={styles.heroValue}>{formatBRL(summary.totalSaved)}</div>
                <div className={styles.heroSub}>em {summary.count} meta{summary.count !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className={styles.heroStat}>
              <div>
                <div className={styles.heroLabel}>Objetivo total</div>
                <div className={styles.heroValue}>{formatBRL(summary.totalTarget)}</div>
                <div className={styles.heroSub}>{formatPercent(summary.overallPct)} do plano</div>
              </div>
            </div>
            <div className={styles.heroStat}>
              <div>
                <div className={styles.heroLabel}>Concluídas</div>
                <div className={styles.heroValue}>
                  {summary.completed}
                  <span style={{ fontSize: '0.85em', color: 'var(--muted)', fontWeight: 600 }}>
                    {' '}
                    / {summary.count}
                  </span>
                </div>
                <div className={styles.heroSub}>
                  {summary.completed === summary.count ? 'Tudo certo por aqui' : 'Continue depositando'}
                </div>
              </div>
            </div>
          </section>
        )}

        {data.goals.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden>
              🎯
            </div>
            <h2 className={styles.emptyTitle}>Comece uma meta</h2>
            <p className={styles.emptyText}>
              Viagem, reserva de emergência ou um sonho — acompanhe cada depósito com números claros e
              progresso visual.
            </p>
            <Button onClick={openNew}>Criar primeira meta</Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {data.goals.map((g) => (
              <GoalCard key={g.id} goal={g} onEdit={() => openEdit(g)} onDeposit={() => setDepositGoal(g)} />
            ))}
          </div>
        )}
      </div>

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
        userId={user?.id}
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

function GoalCard({
  goal: g,
  onEdit,
  onDeposit,
}: {
  goal: Goal
  onEdit: () => void
  onDeposit: () => void
}) {
  const { pct, remaining } = goalProgress(g)
  const done = remaining <= 0
  const ringColor = done ? 'var(--green)' : g.color
  const daysLeft = daysUntilDeadline(g.deadline)

  return (
    <article
      className={`${styles.card} ${done ? styles.cardDone : ''} fadein`}
      style={{ ['--goal-color' as string]: g.color, ['--ring-color' as string]: ringColor, ['--pct' as string]: pct }}
    >
      <div className={styles.cardTop}>
        <div className={styles.icon} aria-hidden>
          {g.icon}
        </div>
        <div className={styles.head}>
          <div className={styles.nameRow}>
            <button type="button" className={styles.name} onClick={onEdit}>
              {g.name}
            </button>
            <button type="button" className={styles.editBtn} onClick={onEdit} aria-label={`Editar ${g.name}`}>
              ✎
            </button>
          </div>
          {g.deadline && (
            <span className={styles.deadlineChip}>
              {done
                ? 'Concluída'
                : daysLeft != null && daysLeft >= 0
                  ? daysLeft === 0
                    ? 'Prazo hoje'
                    : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} · até ${formatDate(g.deadline)}`
                  : `Até ${formatDate(g.deadline)}`}
            </span>
          )}
        </div>
        <div
          className={`${styles.ringWrap} ${done ? styles.ringDone : ''}`}
          style={{ ['--pct' as string]: pct, ['--ring-color' as string]: ringColor }}
          aria-hidden
        >
          <div className={styles.ringInner}>{formatPercent(pct)}</div>
        </div>
      </div>

      <div className={styles.amounts}>
        <span className={styles.saved}>{formatBRL(g.saved)}</span>
        <span className={styles.ofTarget}>de {formatBRL(g.target)}</span>
      </div>

      <div className={styles.barTrack}>
        <div
          className={done ? `${styles.barFill} ${styles.barFillDone}` : styles.barFill}
          style={{ width: `${pct}%`, ...(done ? {} : { ['--goal-color' as string]: g.color }) }}
        />
      </div>

      <div className={styles.cardFoot}>
        {done ? (
          <span className={styles.doneLabel}>Meta alcançada</span>
        ) : (
          <span className={styles.remaining}>Faltam {formatBRL(remaining as Cents)}</span>
        )}
        <button type="button" className={styles.depositBtn} onClick={onDeposit}>
          Depositar
        </button>
      </div>
    </article>
  )
}
