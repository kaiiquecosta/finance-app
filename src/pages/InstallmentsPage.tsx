import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { formatBRL, mul } from '@/domain/money'
import {
  deriveInstallments,
  effectiveColor,
  installmentProgress,
  summarizeInstallments,
} from '@/domain/calc/installments'
import styles from './InstallmentsPage.module.css'

export function InstallmentsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)

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
                    <div
                      className={styles.fill}
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
