import { useMemo, useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { HeaderActionButton } from '@/components/legacy/HeaderActionButton'
import { GroupedTransactionList } from '@/components/legacy/GroupedTransactionList'
import { MonthNav, labelMonthYear } from '@/components/legacy/MonthNav'
import { TransactionModal } from '@/features/transactions/TransactionModal'
import { useTransactionMutations } from '@/features/transactions/useTransactionMutations'
import { formatBRL } from '@/domain/money'
import { parseISODate } from '@/domain/dates'
import { summarizeTransactions } from '@/domain/calc/overview'
import { isManualExpenseTransaction } from '@/domain/transactions'
import type { Transaction } from '@/domain/entities'

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
  const editableCount = monthTxs.filter(isManualExpenseTransaction).length

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
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Não foi possível carregar suas transações.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Transações"
        subtitle={`${monthTxs.length} registros · débitos são editáveis (${editableCount})`}
        action={<HeaderActionButton onClick={openNew}>＋ Nova</HeaderActionButton>}
      />

      <MonthNav
        month={month}
        year={year}
        monthOffset={monthOffset}
        label={labelMonthYear(month, year)}
        onPrev={() => setMonthOffset((m) => m - 1)}
        onNext={() => setMonthOffset((m) => m + 1)}
        onGoToday={() => setMonthOffset(0)}
      />

      <div className="grid3" style={{ marginBottom: 20 }}>
        <div className="card card-sm" style={{ textAlign: 'center' }}>
          <div className="card-label">Receitas</div>
          <div className="num-md num-green">{formatBRL(summary.income)}</div>
        </div>
        <div className="card card-sm" style={{ textAlign: 'center' }}>
          <div className="card-label">Gastos</div>
          <div className="num-md num-red">{formatBRL(summary.spent)}</div>
        </div>
        <div className="card card-sm" style={{ textAlign: 'center' }}>
          <div className="card-label">Saldo</div>
          <div className="num-md" style={{ color: summary.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {formatBRL(summary.balance, { sign: true })}
          </div>
        </div>
      </div>

      <div className="card fadein">
        <GroupedTransactionList
          transactions={monthTxs}
          accounts={data.bankAccounts}
          onEdit={openEdit}
        />
      </div>

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
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Excluir <b>{confirmDelete?.name}</b>? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </>
  )
}
