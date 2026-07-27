import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { useEntityMutations } from '@/data/useEntityMutations'
import { toSubscriptionRow } from '@/data/mappers'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SubscriptionModal } from '@/features/subscriptions/SubscriptionModal'
import { formatBRL, mul, sum } from '@/domain/money'
import type { Subscription } from '@/domain/entities'
import styles from './SubscriptionsPage.module.css'

export function SubscriptionsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const { save, remove } = useEntityMutations<Subscription>('subscriptions', toSubscriptionRow, user?.id)

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
            <Card title="Por mês">
              <div className={styles.num}>{formatBRL(monthly)}</div>
            </Card>
            <Card title="Por ano">
              <div className={styles.num}>{formatBRL(yearly)}</div>
            </Card>
            <Card title="Serviços">
              <div className={styles.num}>{data.subscriptions.length}</div>
            </Card>
          </div>

          <Card title="Todas" className={styles.mt}>
            <div className={styles.list}>
              {subs.map((s) => (
                <button
                  key={s.id}
                  className={styles.row}
                  onClick={() => {
                    setEditing(s)
                    setModalOpen(true)
                  }}
                >
                  <span className={styles.icon}>{s.icon}</span>
                  <div className={styles.info}>
                    <span className={styles.name}>{s.name}</span>
                    <span className={styles.sub}>Todo dia {s.day}</span>
                  </div>
                  <span className={styles.amt}>{formatBRL(s.amt)}/mês</span>
                </button>
              ))}
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
