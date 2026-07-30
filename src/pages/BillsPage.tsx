import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { useBillMutations } from '@/features/bills/useBillMutations'
import { FixedBillModal } from '@/features/bills/FixedBillModal'
import { PayBillModal } from '@/features/bills/PayBillModal'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatBRL, sum } from '@/domain/money'
import { upcomingCardInvoices } from '@/domain/calc/cards'
import type { FixedBill } from '@/domain/entities'
import styles from './BillsPage.module.css'

type Row =
  | { kind: 'fixed'; dueDay: number; bill: FixedBill }
  | { kind: 'card'; dueDay: number; invoiceId: string; cardName: string; color: string; amt: FixedBill['amt'] }

export function BillsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const { save, remove, setPaid } = useBillMutations(user?.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FixedBill | null>(null)
  const [payBill, setPayBill] = useState<FixedBill | null>(null)

  if (isLoading) return <PageHeader title="Contas fixas" subtitle="Carregando…" />
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Contas fixas" />
        <Card>
          <p className={styles.muted}>Não foi possível carregar suas contas.</p>
        </Card>
      </>
    )
  }

  const fixedBills = [...data.fixedBills].sort((a, b) => a.dueDay - b.dueDay)
  const total = sum(fixedBills.map((b) => b.amt))
  const paid = sum(fixedBills.filter((b) => b.paid).map((b) => b.amt))
  const pending = sum(fixedBills.filter((b) => !b.paid).map((b) => b.amt))

  // Faturas de cartão em aberto (só o mês atual) somam-se à visão unificada de
  // vencimentos, sem entrar nos totais de "pagas/pendentes" acima — o
  // acompanhamento de pagamento do cartão continua na página Cartões.
  const cardInvoices = upcomingCardInvoices(data.cards, new Date(), 1)

  const rows: Row[] = [
    ...fixedBills.map((bill): Row => ({ kind: 'fixed', dueDay: bill.dueDay, bill })),
    ...cardInvoices.map(
      (inv): Row => ({
        kind: 'card',
        dueDay: inv.dueDay,
        invoiceId: inv.id,
        cardName: inv.cardName,
        color: inv.color,
        amt: inv.amt,
      }),
    ),
  ].sort((a, b) => a.dueDay - b.dueDay)

  const txIdForBill = (billId: number): number | null =>
    data.transactions.find((t) => t.billId === billId)?.id ?? null

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Contas fixas"
        subtitle="Vencimentos do mês (contas fixas + fatura do cartão)"
        action={<Button onClick={openNew}>＋ Nova</Button>}
      />

      {rows.length === 0 ? (
        <Card>
          <p className={styles.muted}>
            Nenhuma conta fixa. Cadastre aluguel, luz, internet… e acompanhe os vencimentos.
          </p>
        </Card>
      ) : (
        <>
          <div className={styles.summary}>
            <Card title="Total do mês">
              <div className={styles.num}>{formatBRL(total)}</div>
            </Card>
            <Card title="Pagas">
              <div className={`${styles.num} ${styles.pos}`}>{formatBRL(paid)}</div>
            </Card>
            <Card title="Pendentes">
              <div className={`${styles.num} ${styles.neg}`}>{formatBRL(pending)}</div>
            </Card>
          </div>

          <Card title="Contas" className={styles.mt}>
            <div className={styles.list}>
              {rows.map((row) =>
                row.kind === 'fixed' ? (
                  <div
                    key={`fixed-${row.bill.id}`}
                    className={`${styles.row} ${row.bill.paid ? styles.rowPaid : ''}`}
                  >
                    <span className={styles.icon}>{row.bill.icon}</span>
                    <button
                      className={styles.info}
                      onClick={() => {
                        setEditing(row.bill)
                        setModalOpen(true)
                      }}
                    >
                      <span className={styles.name}>{row.bill.name}</span>
                      <span className={styles.sub}>
                        vence dia {row.bill.dueDay} · {row.bill.category}
                      </span>
                    </button>
                    <span className={styles.amt}>{formatBRL(row.bill.amt)}</span>
                    {row.bill.paid ? (
                      <button
                        className={styles.undo}
                        disabled={setPaid.isPending}
                        onClick={() =>
                          void setPaid.mutateAsync({
                            bill: row.bill,
                            paid: false,
                            existingTxId: txIdForBill(row.bill.id),
                          })
                        }
                      >
                        ✓ paga
                      </button>
                    ) : (
                      <Button onClick={() => setPayBill(row.bill)}>Pagar</Button>
                    )}
                  </div>
                ) : (
                  <div key={`card-${row.invoiceId}`} className={styles.row}>
                    <span className={styles.icon} style={{ background: `${row.color}22` }}>
                      💳
                    </span>
                    <div className={styles.info}>
                      <span className={styles.name}>{row.cardName} · fatura</span>
                      <span className={styles.sub}>vence dia {row.dueDay} · cartão de crédito</span>
                    </div>
                    <span className={styles.amt}>{formatBRL(row.amt)}</span>
                    <Link to="/app/cartoes" className={styles.cardLink}>
                      Ver fatura →
                    </Link>
                  </div>
                ),
              )}
            </div>
          </Card>
        </>
      )}

      <FixedBillModal
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

      <PayBillModal
        open={payBill !== null}
        bill={payBill}
        accounts={data.bankAccounts}
        saving={setPaid.isPending}
        onClose={() => setPayBill(null)}
        onConfirm={async (accountId) => {
          if (payBill) await setPaid.mutateAsync({ bill: payBill, paid: true, accountId })
          setPayBill(null)
        }}
      />
    </>
  )
}
