import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { HeaderActionButton } from '@/components/legacy/HeaderActionButton'
import { SubscriptionModal } from '@/features/subscriptions/SubscriptionModal'
import { useSubscriptionMutations } from '@/features/subscriptions/useSubscriptionMutations'
import { formatBRL, mul, sum, cents, ZERO } from '@/domain/money'
import type { Subscription } from '@/domain/entities'

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
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Não foi possível carregar suas assinaturas.</p>
        </div>
      </>
    )
  }

  const monthly = sum(data.subscriptions.map((s) => s.amt))
  const yearly = mul(monthly, 12)
  const count = data.subscriptions.length
  const avg = count > 0 ? cents(Math.round(monthly / count)) : ZERO
  const subs = [...data.subscriptions].sort((a, b) => a.day - b.day)

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Assinaturas"
        subtitle="Serviços recorrentes e projeção anual"
        action={<HeaderActionButton onClick={openNew}>＋ Nova</HeaderActionButton>}
      />

      {data.subscriptions.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Nenhuma assinatura. Cadastre Netflix, Spotify, academia… e veja quanto comprometem por mês.
          </p>
        </div>
      ) : (
        <>
          <div className="grid4" style={{ marginBottom: 16 }}>
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div className="card-label">📺 Assinaturas</div>
              <div className="num-md" style={{ color: '#a78bfa' }}>
                {count}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>ativas</div>
            </div>
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div className="card-label">Gasto mensal</div>
              <div className="num-md num-red">{formatBRL(monthly)}</div>
            </div>
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div className="card-label">Projeção anual</div>
              <div className="num-md" style={{ color: '#f59e0b' }}>
                {formatBRL(yearly)}
              </div>
            </div>
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div className="card-label">Média/serviço</div>
              <div className="num-md num-green">{formatBRL(avg)}</div>
            </div>
          </div>

          <div className="card fadein">
            <div className="card-title">
              <span className="icon">🔁</span> Suas assinaturas
            </div>
            {subs.map((s) => (
              <button
                key={s.id}
                type="button"
                className="sub-row"
                onClick={() => {
                  setEditing(s)
                  setModalOpen(true)
                }}
              >
                <div
                  className="tx-ico"
                  style={{
                    background: `${s.color}22`,
                    border: `1px solid ${s.color}40`,
                  }}
                >
                  {s.icon}
                </div>
                <div className="tx-info">
                  <div className="tx-name sub-name">{s.name}</div>
                  <div className="tx-meta">Todo dia {s.day}</div>
                </div>
                <div className="tx-amt">{formatBRL(s.amt)}/mês</div>
              </button>
            ))}
          </div>
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
