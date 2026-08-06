import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, formatBRL, sub, type Cents } from '@/domain/money'
import { goalProgress } from '@/domain/calc/goals'
import type { BankAccount, Goal } from '@/domain/entities'
import { AccountPicker } from '@/components/accounts/AccountPicker'
import styles from './GoalDepositModal.module.css'

type Mode = 'add' | 'remove'

interface Props {
  open: boolean
  goal: Goal | null
  accounts: BankAccount[]
  userId: string | undefined
  saving?: boolean
  onClose: () => void
  onConfirm: (input: { amount: Cents; mode: Mode; accountId: number | null }) => Promise<void>
}

export function GoalDepositModal({ open, goal, accounts, userId, saving, onClose, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>('add')
  const [amount, setAmount] = useState<Cents>(ZERO)
  const [accountId, setAccountId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setMode('add')
    setAmount(ZERO)
    setAccountId(accounts[0]?.id ?? null)
    setError('')
  }, [open, accounts])

  if (!goal) return null
  const remaining = sub(goal.target, goal.saved)

  const submit = async () => {
    setError('')
    if (amount <= 0) return setError('Informe um valor maior que zero.')
    try {
      await onConfirm({ amount, mode, accountId })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir.')
    }
  }

  return (
    <Modal
      open={open}
      title={`"${goal.name}"`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            block
            variant={mode === 'add' ? 'primary' : 'danger'}
            loading={saving}
            onClick={() => void submit()}
          >
            {mode === 'add' ? 'Depositar' : 'Retirar'}
          </Button>
        </>
      }
    >
      <div className={styles.tabs}>
        <button
          type="button"
          className={mode === 'add' ? `${styles.tab} ${styles.tabAdd}` : styles.tab}
          onClick={() => setMode('add')}
        >
          ↑ Depositar
        </button>
        <button
          type="button"
          className={mode === 'remove' ? `${styles.tab} ${styles.tabRemove}` : styles.tab}
          onClick={() => setMode('remove')}
        >
          ↓ Retirar
        </button>
      </div>

      <p className={styles.context}>
        {mode === 'add' ? (
          <>
            Faltam <b>{formatBRL(goalProgress(goal).remaining)}</b> para completar
          </>
        ) : (
          <>
            Guardado: <b>{formatBRL(goal.saved)}</b>
          </>
        )}
      </p>

      <MoneyField
        label={mode === 'add' ? 'Quanto depositar?' : 'Quanto retirar?'}
        value={amount}
        onChange={setAmount}
        autoFocus
      />

      <AccountPicker
        label={mode === 'add' ? 'De qual conta sai?' : 'Para qual conta vai?'}
        accounts={accounts}
        value={accountId}
        onChange={setAccountId}
        userId={userId}
      />

      {remaining <= 0 && mode === 'add' && (
        <p className={styles.done}>🎉 Meta concluída! Depósitos extras não passam do alvo.</p>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
