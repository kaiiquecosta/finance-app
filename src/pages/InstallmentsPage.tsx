import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
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
import styles from './InstallmentsPage.module.css'

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
        <Card>
          <p className={styles.muted}>Não foi possível carregar seus parcelamentos.</p>
        </Card>
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
      <PageHeader title="Parcelas" subtitle="Parcelamentos ativos" />

      {list.length === 0 ? (
        <Card>
          <p className={styles.muted}>
            Nenhum parcelamento ativo. Compras parceladas no cartão aparecem aqui automaticamente.
          </p>
        </Card>
      ) : (
        <>
          <div className={styles.summary}>
            <Card title="Total ainda devido">
              <div className={styles.num}>{formatBRL(summary.totalRemaining)}</div>
            </Card>
            <Card title="Comprometido por mês">
              <div className={`${styles.num} ${styles.neg}`}>{formatBRL(summary.monthly)}</div>
            </Card>
          </div>

          <div className={styles.list}>
            {list.map((inst) => {
              const { remaining, pct, parcel } = installmentProgress(inst)
              const color = effectiveColor(inst)
              const canAdvance = inst.source === 'card' && remaining > 1 && cardFor(inst) !== null
              return (
                <Card key={inst.id} className={styles.item}>
                  <div className={styles.top}>
                    <span className={styles.icon} style={{ background: `${color}22` }}>
                      {inst.icon}
                    </span>
                    <div className={styles.info}>
                      <span className={styles.name}>{inst.name}</span>
                      <span className={styles.sub}>
                        {inst.paid}/{inst.parcels} pagas · {formatBRL(parcel)}/mês
                        {inst.cardName ? ` · ${inst.cardName}` : ''}
                      </span>
                    </div>
                    <div className={styles.right}>
                      <span className={styles.remainVal}>{formatBRL(mul(parcel, remaining))}</span>
                      <span className={styles.remainLbl}>restam {remaining}x</span>
                    </div>
                  </div>
                  <div className={styles.bar}>
                    <div className={styles.fill} style={{ width: `${pct}%`, background: color }} />
                  </div>
                  {canAdvance && (
                    <div className={styles.actions}>
                      <Button variant="ghost" onClick={() => setAdvancing(inst)}>
                        ⚡ Adiantar parcelas
                      </Button>
                    </div>
                  )}
                </Card>
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
