import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, abs, neg, type Cents } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import { CATEGORY_ICONS, inferCategory } from '@/domain/categories'
import type { BankAccount, Transaction } from '@/domain/entities'
import type { TransactionDraft } from './useTransactionMutations'
import styles from './TransactionModal.module.css'

type Kind = 'expense' | 'income'

const QUICK_CATEGORIES = [
  'mercado',
  'alimentação',
  'transporte',
  'streaming',
  'saúde',
  'moradia',
  'lazer',
  'compras',
  'educação',
  'outros',
]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (draft: TransactionDraft) => Promise<void> | void
  saving?: boolean
  accounts: BankAccount[]
  /** Preenchido quando estamos editando. */
  editing?: Transaction | null
}

export function TransactionModal({ open, onClose, onSave, saving, accounts, editing }: Props) {
  const [kind, setKind] = useState<Kind>('expense')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState<Cents>(ZERO)
  const [date, setDate] = useState(toISODate(new Date()))
  const [cat, setCat] = useState('outros')
  const [accountId, setAccountId] = useState<number | null>(null)
  const [error, setError] = useState('')

  // Sincroniza o formulário ao abrir (novo ou edição).
  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setKind(editing.amt >= 0 ? 'income' : 'expense')
      setName(editing.name)
      setAmount(abs(editing.amt))
      setDate(editing.date)
      setCat(editing.cat || 'outros')
      setAccountId(editing.accountId ?? null)
    } else {
      setKind('expense')
      setName('')
      setAmount(ZERO)
      setDate(toISODate(new Date()))
      setCat('outros')
      setAccountId(accounts[0]?.id ?? null)
    }
  }, [open, editing, accounts])

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('Dê um nome para a transação.')
    if (amount <= 0) return setError('Informe um valor maior que zero.')

    const resolvedCat = kind === 'income' ? 'receita' : cat === 'outros' ? inferCategory(name) : cat
    await onSave({
      id: editing?.id,
      name: name.trim(),
      cat: resolvedCat,
      amt: kind === 'expense' ? neg(amount) : amount,
      date,
      accountId,
      investmentId: editing?.investmentId ?? null,
      billId: editing?.billId ?? null,
      incomeKey: editing?.incomeKey ?? null,
    })
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Editar transação' : 'Nova transação'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button block loading={saving} onClick={() => void submit()}>
            {editing ? 'Salvar' : 'Adicionar'}
          </Button>
        </>
      }
    >
      <div className={styles.tabs}>
        <button
          type="button"
          className={kind === 'expense' ? `${styles.tab} ${styles.tabExpense}` : styles.tab}
          onClick={() => setKind('expense')}
        >
          − Gasto
        </button>
        <button
          type="button"
          className={kind === 'income' ? `${styles.tab} ${styles.tabIncome}` : styles.tab}
          onClick={() => setKind('income')}
        >
          + Receita
        </button>
      </div>

      <TextField
        label="Descrição"
        name="tx-name"
        autoFocus
        placeholder={kind === 'expense' ? 'Ex.: Mercado, iFood…' : 'Ex.: Salário, Freela…'}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <MoneyField value={amount} onChange={setAmount} />

      <TextField
        label="Data"
        name="tx-date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {kind === 'expense' && (
        <div>
          <span className={styles.label}>Categoria</span>
          <div className={styles.chips}>
            {QUICK_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={cat === c ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                onClick={() => setCat(c)}
              >
                <span aria-hidden>{CATEGORY_ICONS[c] ?? '💳'}</span> {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {accounts.length > 0 && (
        <div>
          <span className={styles.label}>Conta</span>
          <div className={styles.chips}>
            {accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                className={accountId === a.id ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                onClick={() => setAccountId(a.id)}
              >
                {a.name}
              </button>
            ))}
            <button
              type="button"
              className={accountId === null ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              onClick={() => setAccountId(null)}
            >
              Sem conta
            </button>
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
