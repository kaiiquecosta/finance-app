import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/domain/money'
import { parseISODate } from '@/domain/dates'
import { MONTHS } from '@/domain/categories'
import { planAdvance, type AdvancePlan, type DerivedInstallment } from '@/domain/calc/installments'
import type { BankAccount, Card as CardEntity } from '@/domain/entities'
import { AccountPicker } from '@/components/accounts/AccountPicker'
import styles from './AdvanceModal.module.css'

interface Props {
  open: boolean
  installment: DerivedInstallment | null
  card: CardEntity | null
  accounts: BankAccount[]
  userId: string | undefined
  saving?: boolean
  onClose: () => void
  onConfirm: (plan: AdvancePlan, accountId: number | null, label: string) => Promise<void>
}

export function AdvanceModal({ open, installment, card, accounts, userId, saving, onClose, onConfirm }: Props) {
  const [qty, setQty] = useState(1)
  const [accountId, setAccountId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setQty(1)
    setAccountId(accounts[0]?.id ?? null)
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accounts omitido de propósito
  }, [open])

  useEffect(() => {
    if (!open) return
    setAccountId((current) => {
      if (current != null && accounts.some((a) => a.id === current)) return current
      return accounts[0]?.id ?? current
    })
  }, [open, accounts])

  if (!installment || !card) return null

  const now = new Date()
  const plan = planAdvance(card, installment.name, installment.parcels, qty, now)
  const monthsLabel = plan.months
    .map((d) => MONTHS[parseISODate(d).getMonth()])
    .join(', ')

  const confirm = async () => {
    setError('')
    if (plan.billsToAdvance.length === 0) return setError('Não há parcelas para antecipar.')
    try {
      await onConfirm(plan, accountId, installment.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível antecipar.')
    }
  }

  return (
    <Modal
      open={open}
      title={`⚡ Adiantar "${installment.name}"`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button block loading={saving} onClick={() => void confirm()} disabled={plan.maxQty === 0}>
            Antecipar {formatBRL(plan.freedAmount)}
          </Button>
        </>
      }
    >
      {plan.maxQty === 0 ? (
        <p className={styles.muted}>
          Este parcelamento não tem parcelas futuras antecipáveis (só resta a fatura atual).
        </p>
      ) : (
        <>
          <div className={styles.stepper}>
            <button
              className={styles.step}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
            >
              −
            </button>
            <div className={styles.qty}>
              <span className={styles.qtyNum}>{qty}</span>
              <span className={styles.qtyLbl}>parcela(s)</span>
            </div>
            <button
              className={styles.step}
              onClick={() => setQty((q) => Math.min(plan.maxQty, q + 1))}
              disabled={qty >= plan.maxQty}
            >
              +
            </button>
          </div>

          <div className={styles.preview}>
            <div className={styles.previewRow}>
              <span className={styles.muted}>Limite liberado</span>
              <b className={styles.green}>{formatBRL(plan.freedAmount)}</b>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.muted}>Some das faturas de</span>
              <b>{monthsLabel}</b>
            </div>
          </div>

          <p className={styles.hint}>
            Você pode antecipar até <b>{plan.maxQty}</b> parcela(s). O valor sai da conta escolhida
            agora.
          </p>

          <AccountPicker
            label="De qual conta sai?"
            accounts={accounts}
            value={accountId}
            onChange={setAccountId}
            userId={userId}
          />
        </>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
