import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { useRates } from '@/data/useMarket'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MarketSection } from '@/features/investments/MarketSection'
import { InvestmentModal } from '@/features/investments/InvestmentModal'
import { useInvestmentMutations } from '@/features/investments/useInvestmentMutations'
import { formatBRL, sub, sum } from '@/domain/money'
import { DEFAULT_RATES, calcInvestment } from '@/domain/calc/investment'
import type { Investment, InvestmentType } from '@/domain/entities'
import styles from './InvestmentsPage.module.css'

const TYPE_LABELS: Record<InvestmentType, string> = {
  cdb: 'CDB',
  lci: 'LCI/LCA',
  selic: 'Tesouro Selic',
  ipca: 'Tesouro IPCA+',
  poupanca: 'Poupança',
  acoes: 'Ações BR',
  acoeseua: 'Ações EUA',
  fii: 'FIIs',
  cripto: 'Cripto',
  outro: 'Outro',
}

export function InvestmentsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const rates = useRates()
  const { add, remove } = useInvestmentMutations(user?.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Investment | null>(null)

  if (isLoading) return <PageHeader title="Investimentos" subtitle="Carregando…" />
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Investimentos" />
        <Card>
          <p className={styles.muted}>Não foi possível carregar sua carteira.</p>
        </Card>
      </>
    )
  }

  const now = new Date()
  const marketRates = rates.data
    ? { cdi: rates.data.cdi, ipca: rates.data.ipca }
    : DEFAULT_RATES
  const rows = data.investments.map((inv) => ({
    inv,
    r: calcInvestment(
      { amount: inv.amount, type: inv.type, date: inv.date, pct: inv.pct, spread: inv.spread, yield: inv.yield },
      now,
      marketRates,
    ),
  }))
  const applied = sum(data.investments.map((i) => i.amount))
  const netTotal = sum(rows.map((x) => x.r.netAmount))
  const netYield = sub(netTotal, applied)
  const positive = netYield >= 0

  return (
    <>
      <PageHeader
        title="Investimentos"
        subtitle={rates.data ? 'Rendimento com CDI/IPCA em tempo real' : 'Sua carteira'}
        action={<Button onClick={() => setModalOpen(true)}>＋ Investir</Button>}
      />

      <Card title="Minha carteira">
        {data.investments.length === 0 ? (
          <p className={styles.muted}>
            Nenhum investimento ainda. Clique em <b>＋ Investir</b> e acompanhe o rendimento com as
            taxas reais do mercado.
          </p>
        ) : (
          <>
            <div className={styles.totals}>
              <div>
                <span className={styles.totLabel}>Aplicado</span>
                <span className={styles.totValue}>{formatBRL(applied)}</span>
              </div>
              <div>
                <span className={styles.totLabel}>Valor atual (líquido)</span>
                <span className={styles.totValue}>{formatBRL(netTotal)}</span>
              </div>
              <div>
                <span className={styles.totLabel}>Rendimento líquido</span>
                <span className={`${styles.totValue} ${positive ? styles.pos : styles.neg}`}>
                  {formatBRL(netYield, { sign: true })}
                </span>
              </div>
            </div>

            <div className={styles.list}>
              {rows.map(({ inv, r }) => (
                <div key={inv.id} className={styles.row}>
                  <div className={styles.info}>
                    <span className={styles.name}>{inv.name}</span>
                    <span className={styles.sub}>
                      {TYPE_LABELS[inv.type]}
                      {inv.bank ? ` · ${inv.bank}` : ''} · {r.days}d
                    </span>
                  </div>
                  <div className={styles.right}>
                    <span className={styles.netAmt}>{formatBRL(r.netAmount)}</span>
                    <span className={r.netYield >= 0 ? styles.pos : styles.neg}>
                      {formatBRL(r.netYield, { sign: true })}
                    </span>
                  </div>
                  <button
                    className={styles.del}
                    title="Excluir"
                    onClick={() => setConfirmDelete(inv)}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
            <p className={styles.note}>
              Rendimento estimado (juros compostos) com IR simplificado. Valores de renda variável
              usam a rentabilidade estimada informada.
            </p>
          </>
        )}
      </Card>

      <MarketSection />

      <InvestmentModal
        open={modalOpen}
        accounts={data.bankAccounts}
        saving={add.isPending}
        onClose={() => setModalOpen(false)}
        onSave={async (draft) => {
          await add.mutateAsync(draft)
          setModalOpen(false)
        }}
      />

      <Modal
        open={confirmDelete !== null}
        title="Excluir investimento"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              block
              loading={remove.isPending}
              onClick={async () => {
                if (confirmDelete) await remove.mutateAsync(confirmDelete.id)
                setConfirmDelete(null)
              }}
            >
              Excluir
            </Button>
          </>
        }
      >
        <p className={styles.muted}>
          Excluir <b>{confirmDelete?.name}</b>? (A transação de aporte não é removida.)
        </p>
      </Modal>
    </>
  )
}
