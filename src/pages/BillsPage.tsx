import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { useBillMutations } from '@/features/bills/useBillMutations'
import { FixedBillModal } from '@/features/bills/FixedBillModal'
import { PayBillModal } from '@/features/bills/PayBillModal'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatBRL, sum } from '@/domain/money'
import type { FixedBill } from '@/domain/entities'
import styles from './BillsPage.module.css'

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

  const bills = [...data.fixedBills].sort((a, b) => a.dueDay - b.dueDay)
  const total = sum(bills.map((b) => b.amt))
  const paid = sum(bills.filter((b) => b.paid).map((b) => b.amt))
  const pending = sum(bills.filter((b) => !b.paid).map((b) => b.amt))

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
        subtitle="Vencimentos do mês"
        action={<Button onClick={openNew}>＋ Nova</Button>}
      />

      {bills.length === 0 ? (
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
              {bills.map((b) => (
                <div key={b.id} className={`${styles.row} ${b.paid ? styles.rowPaid : ''}`}>
                  <span className={styles.icon}>{b.icon}</span>
                  <button
                    className={styles.info}
                    onClick={() => {
                      setEditing(b)
                      setModalOpen(true)
                    }}
                  >
                    <span className={styles.name}>{b.name}</span>
                    <span className={styles.sub}>
                      vence dia {b.dueDay} · {b.category}
                    </span>
                  </button>
                  <span className={styles.amt}>{formatBRL(b.amt)}</span>
                  {b.paid ? (
                    <button
                      className={styles.undo}
                      disabled={setPaid.isPending}
                      onClick={() =>
                        void setPaid.mutateAsync({
                          bill: b,
                          paid: false,
                          existingTxId: txIdForBill(b.id),
                        })
                      }
                    >
                      ✓ paga
                    </button>
                  ) : (
                    <Button onClick={() => setPayBill(b)}>Pagar</Button>
                  )}
                </div>
              ))}
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
