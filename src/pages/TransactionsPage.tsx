import { useMemo, useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TransactionModal } from '@/features/transactions/TransactionModal'
import { useTransactionMutations } from '@/features/transactions/useTransactionMutations'
import { formatBRL } from '@/domain/money'
import { parseISODate } from '@/domain/dates'
import { MONTHS_FULL, iconFor } from '@/domain/categories'
import { summarizeTransactions } from '@/domain/calc/overview'
import { formatDate } from '@/lib/format'
import type { Transaction } from '@/domain/entities'
import styles from './TransactionsPage.module.css'

export function TransactionsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const { save, remove } = useTransactionMutations(user?.id)

  const [monthOffset, setMonthOffset] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null)

  const ref = new Date()
  ref.setDate(1)
  ref.setMonth(ref.getMonth() + monthOffset)
  const month = ref.getMonth()
  const year = ref.getFullYear()

  const monthTxs = useMemo(() => {
    if (!data) return []
    return data.transactions
      .filter((t) => {
        const d = parseISODate(t.date)
        return d.getMonth() === month && d.getFullYear() === year
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [data, month, year])

  const summary = summarizeTransactions(monthTxs)

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (t: Transaction) => {
    setEditing(t)
    setModalOpen(true)
  }

  if (isLoading) return <PageHeader title="Transações" subtitle="Carregando…" />
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Transações" />
        <Card>
          <p className={styles.muted}>Não foi possível carregar suas transações.</p>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Transações"
        subtitle="Seus lançamentos do dia a dia"
        action={<Button onClick={openNew}>＋ Nova</Button>}
      />

      <div className={styles.monthNav}>
        <button className={styles.navBtn} onClick={() => setMonthOffset((m) => m - 1)}>
          ‹
        </button>
        <span className={styles.monthLabel}>
          {MONTHS_FULL[month]} de {year}
        </span>
        <button className={styles.navBtn} onClick={() => setMonthOffset((m) => m + 1)}>
          ›
        </button>
        {monthOffset !== 0 && (
          <button className={styles.today} onClick={() => setMonthOffset(0)}>
            hoje
          </button>
        )}
      </div>

      <div className={styles.summary}>
        <Card title="Receitas">
          <div className={`${styles.num} ${styles.pos}`}>{formatBRL(summary.income)}</div>
        </Card>
        <Card title="Gastos">
          <div className={`${styles.num} ${styles.neg}`}>{formatBRL(summary.spent)}</div>
        </Card>
        <Card title="Saldo">
          <div className={`${styles.num} ${summary.balance >= 0 ? styles.pos : styles.neg}`}>
            {formatBRL(summary.balance, { sign: true })}
          </div>
        </Card>
      </div>

      <Card title={`${monthTxs.length} lançamento(s)`} className={styles.mt}>
        {monthTxs.length === 0 ? (
          <p className={styles.muted}>
            Nenhuma transação neste mês. Clique em <b>＋ Nova</b> para lançar a primeira.
          </p>
        ) : (
          <div className={styles.list}>
            {monthTxs.map((t) => (
              <div key={t.id} className={styles.row}>
                <span className={styles.icon}>{iconFor(t.cat)}</span>
                <div className={styles.info}>
                  <span className={styles.name}>{t.name}</span>
                  <span className={styles.sub}>
                    {formatDate(t.date)} · {t.cat}
                  </span>
                </div>
                <span className={t.amt >= 0 ? styles.pos : styles.neg}>
                  {formatBRL(t.amt, { sign: true })}
                </span>
                <div className={styles.actions}>
                  <button className={styles.action} onClick={() => openEdit(t)} title="Editar">
                    ✏️
                  </button>
                  <button
                    className={styles.action}
                    onClick={() => setConfirmDelete(t)}
                    title="Excluir"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <TransactionModal
        open={modalOpen}
        editing={editing}
        accounts={data.bankAccounts}
        saving={save.isPending}
        onClose={() => setModalOpen(false)}
        onSave={async (draft) => {
          await save.mutateAsync(draft)
          setModalOpen(false)
        }}
      />

      <Modal
        open={confirmDelete !== null}
        title="Excluir transação"
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
          Excluir <b>{confirmDelete?.name}</b>? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </>
  )
}
