import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SubscriptionModal } from '@/features/subscriptions/SubscriptionModal'
import { useSubscriptionMutations } from '@/features/subscriptions/useSubscriptionMutations'
import { cents, formatBRL, mul, sum, ZERO } from '@/domain/money'
import type { Subscription } from '@/domain/entities'
import styles from './SubscriptionsPage.module.css'

export function SubscriptionsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const { save, remove } = useSubscriptionMutations(user?.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)

  if (isLoading) return <PageHeader title="Assinaturas" subtitle="Carregando…" />
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Assinaturas" />
        <Card>
          <p className={styles.muted}>Não foi possível carregar suas assinaturas.</p>
        </Card>
      </>
    )
  }

  const monthly = sum(data.subscriptions.map((s) => s.amt))
  const yearly = mul(monthly, 12)
  const average = data.subscriptions.length
    ? cents(monthly / data.subscriptions.length)
    : ZERO
  const subs = [...data.subscriptions].sort((a, b) => a.day - b.day)

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Assinaturas"
        subtitle="Serviços recorrentes"
        action={<Button onClick={openNew}>＋ Nova</Button>}
      />

      {data.subscriptions.length === 0 ? (
        <Card>
          <p className={styles.muted}>
            Nenhuma assinatura. Cadastre Netflix, Spotify, academia… e veja quanto comprometem por
            mês.
          </p>
        </Card>
      ) : (
        <>
          <div className={styles.summary}>
            <Card title="📺 Assinaturas">
              <div className={`${styles.num} ${styles.purple}`}>{data.subscriptions.length}</div>
            </Card>
            <Card title="Gasto mensal">
              <div className={`${styles.num} ${styles.red}`}>{formatBRL(monthly)}</div>
            </Card>
            <Card title="Projeção anual">
              <div className={`${styles.num} ${styles.amber}`}>{formatBRL(yearly)}</div>
            </Card>
            <Card title="Média/serviço">
              <div className={`${styles.num} ${styles.green}`}>{formatBRL(average)}</div>
            </Card>
          </div>

          <Card title="🔁 Suas assinaturas" className={styles.mt}>
            <div className={styles.list}>
              {subs.map((s) => {
                const share = monthly > 0 ? (s.amt / monthly) * 100 : 0
                const card = s.cardId ? data.cards.find((c) => c.id === s.cardId) : null
                return (
                  <button
                    key={s.id}
                    className={styles.row}
                    onClick={() => {
                      setEditing(s)
                      setModalOpen(true)
                    }}
                  >
                    <span
                      className={styles.icon}
                      style={{ background: `${s.color}20`, borderColor: `${s.color}40` }}
                    >
                      {s.icon}
                    </span>
                    <div className={styles.info}>
                      <span className={styles.name}>{s.name}</span>
                      <span className={styles.sub}>
                        Cobra dia {s.day}
                        {card ? ` · ${card.name}` : ''}
                      </span>
                      <span className={styles.shareBar}>
                        <span
                          className={styles.shareFill}
                          style={{ width: `${share}%`, background: s.color }}
                        />
                      </span>
                    </div>
                    <span className={styles.amounts}>
                      <span className={styles.amtMonthly}>{formatBRL(s.amt)}</span>
                      <span className={styles.amtYearly}>{formatBRL(mul(s.amt, 12))}/ano</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>
        </>
      )}

      <SubscriptionModal
        open={modalOpen}
        editing={editing}
        cards={data.cards}
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
    </>
  )
}
