import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { useEntityMutations } from '@/data/useEntityMutations'
import { toBankAccountRow } from '@/data/mappers'
import { formatBRL, ZERO, type Cents } from '@/domain/money'
import { accountBalance } from '@/domain/calc/overview'
import type { AccountType, BankAccount, Transaction } from '@/domain/entities'
import styles from './BankAccountsModal.module.css'

const BANK_COLORS = [
  { name: 'Nubank', color: '#8b5cf6' },
  { name: 'Inter', color: '#f97316' },
  { name: 'Itaú', color: '#f59e0b' },
  { name: 'Bradesco', color: '#ef4444' },
  { name: 'Santander', color: '#dc2626' },
  { name: 'Banco do Brasil', color: '#facc15' },
  { name: 'Caixa', color: '#2563eb' },
  { name: 'C6 Bank', color: '#334155' },
  { name: 'PicPay', color: '#22c55e' },
  { name: 'Mercado Pago', color: '#0ea5e9' },
]

const ACCOUNT_TYPES: { id: AccountType; label: string }[] = [
  { id: 'corrente', label: 'Corrente' },
  { id: 'poupanca', label: 'Poupança' },
  { id: 'pagamento', label: 'Pagamento' },
  { id: 'investimento', label: 'Investimento' },
]

interface Props {
  open: boolean
  onClose: () => void
  userId: string | undefined
  accounts: BankAccount[]
  transactions: Transaction[]
}

/** Gerencia contas bancárias: lista com saldo real, adicionar e excluir. */
export function BankAccountsModal({ open, onClose, userId, accounts, transactions }: Props) {
  const { save, remove } = useEntityMutations<BankAccount>(
    'bank_accounts',
    toBankAccountRow,
    userId,
  )
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(BANK_COLORS[0].color)
  const [accountType, setAccountType] = useState<AccountType>('corrente')
  const [initialBalance, setInitialBalance] = useState<Cents>(ZERO)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAdding(accounts.length === 0)
    setError('')
  }, [open, accounts.length])

  const reset = () => {
    setName('')
    setColor(BANK_COLORS[0].color)
    setAccountType('corrente')
    setInitialBalance(ZERO)
  }

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('Informe o nome da conta.')
    try {
      await save.mutateAsync({ name: name.trim(), color, accountType, initialBalance })
      reset()
      setAdding(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  return (
    <Modal open={open} title="🏦 Contas bancárias" onClose={onClose}>
      {accounts.length > 0 && (
        <div className={styles.list}>
          {accounts.map((a) => (
            <div key={a.id} className={styles.item}>
              <span className={styles.dot} style={{ background: a.color }} />
              <div className={styles.info}>
                <span className={styles.name}>{a.name}</span>
                <span className={styles.sub}>{a.accountType}</span>
              </div>
              <span className={styles.balance}>
                {formatBRL(accountBalance(a, transactions))}
              </span>
              <button
                className={styles.del}
                title="Excluir conta"
                disabled={remove.isPending}
                onClick={() => void remove.mutateAsync(a.id)}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className={styles.form}>
          <TextField
            label="Nome da conta"
            name="acc-name"
            autoFocus
            placeholder="Ex.: Nubank"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <span className={styles.label}>Banco / cor</span>
            <div className={styles.chips}>
              {BANK_COLORS.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  className={color === b.color ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                  onClick={() => {
                    setColor(b.color)
                    if (!name.trim()) setName(b.name)
                  }}
                >
                  <span className={styles.dot} style={{ background: b.color }} />
                  {b.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={styles.label}>Tipo</span>
            <div className={styles.chips}>
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={
                    accountType === t.id ? `${styles.chip} ${styles.chipActive}` : styles.chip
                  }
                  onClick={() => setAccountType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <MoneyField
            label="Saldo atual (inicial)"
            value={initialBalance}
            onChange={setInitialBalance}
          />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            {accounts.length > 0 && (
              <Button variant="ghost" onClick={() => setAdding(false)} disabled={save.isPending}>
                Cancelar
              </Button>
            )}
            <Button block loading={save.isPending} onClick={() => void submit()}>
              Adicionar conta
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" block onClick={() => setAdding(true)}>
          ＋ Adicionar conta
        </Button>
      )}
    </Modal>
  )
}
