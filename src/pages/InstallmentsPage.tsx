import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { AdvanceModal } from '@/features/installments/AdvanceModal'
import { useAdvanceInstallment } from '@/features/installments/useAdvance'
import { formatBRL, mul } from '@/domain/money'
import {
  cardIdFromInstallmentId,
  deriveInstallments,
  effectiveColor,
  installmentProgress,
  summarizeInstallments,
  type DerivedInstallment,
} from '@/domain/calc/installments'

export function InstallmentsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const advance = useAdvanceInstallment(user?.id)
  const [advancing, setAdvancing] = useState<DerivedInstallment | null>(null)

  if (isLoading) return <PageHeader title="Parcelas" subtitle="Carregando…" />
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Parcelas" />
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Não foi possível carregar seus parcelamentos.</p>
        </div>
      </>
    )
  }

  const list = deriveInstallments(data.cards, data.installments)
  const summary = summarizeInstallments(list)

  const cardFor = (inst: DerivedInstallment) => {
    const id = cardIdFromInstallmentId(inst.id)
    return id != null ? (data.cards.find((c) => c.id === id) ?? null) : null
  }

  return (
    <>
      <PageHeader title="Parcelas" subtitle="Acompanhe e adiante suas parcelas" />

      {list.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Nenhum parcelamento ativo. Compras parceladas no cartão aparecem aqui automaticamente.
          </p>
        </div>
      ) : (
        <>
          <div className="grid2" style={{ marginBottom: 16 }}>
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div className="card-label">Total em parcelas</div>
              <div className="num-md num-red">{formatBRL(summary.totalRemaining)}</div>
            </div>
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div className="card-label">Parcela mensal</div>
              <div className="num-md" style={{ color: 'var(--amber)' }}>
                {formatBRL(summary.monthly)}
              </div>
            </div>
          </div>

          <div className="card fadein">
            <div className="card-title">
              <span className="icon">📅</span> Seus parcelamentos
            </div>
            {list.map((inst) => {
              const { remaining, pct, parcel } = installmentProgress(inst)
              const color = effectiveColor(inst)
              const canAdvance = inst.source === 'card' && remaining > 1 && cardFor(inst) !== null
              return (
                <div key={inst.id} className="inst-row">
                  <div
                    className="tx-ico"
                    style={{ background: `${color}22`, border: `1px solid ${color}40` }}
                  >
                    {inst.icon}
                  </div>
                  <div className="tx-info">
                    <div className="tx-name">{inst.name}</div>
                    <div className="tx-meta">
                      {inst.paid}/{inst.parcels} pagas · {formatBRL(parcel)}/mês
                      {inst.cardName ? ` · ${inst.cardName}` : ''}
                    </div>
                    <div className="prog" style={{ marginTop: 8 }}>
                      <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="num-md">{formatBRL(mul(parcel, remaining))}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 11 }}>restam {remaining}x</div>
                    {canAdvance && (
                      <Button variant="ghost" style={{ marginTop: 6, height: 32, fontSize: 12 }} onClick={() => setAdvancing(inst)}>
                        ⚡ Adiantar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <AdvanceModal
        open={advancing !== null}
        installment={advancing}
        card={advancing ? cardFor(advancing) : null}
        accounts={data.bankAccounts}
        saving={advance.isPending}
        onClose={() => setAdvancing(null)}
        onConfirm={async (plan, accountId, label) => {
          await advance.mutateAsync({ plan, accountId, label })
          setAdvancing(null)
        }}
      />
    </>
  )
}
