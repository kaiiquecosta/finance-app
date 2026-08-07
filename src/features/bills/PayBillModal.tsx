import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/domain/money'
import type { BankAccount, FixedBill } from '@/domain/entities'
import { AccountPicker } from '@/components/accounts/AccountPicker'
import styles from './PayBillModal.module.css'

interface Props {
  open: boolean
  bill: FixedBill | null
  accounts: BankAccount[]
  userId: string | undefined
  saving?: boolean
  onClose: () => void
  onConfirm: (accountId: number | null) => Promise<void>
}

export function PayBillModal({ open, bill, accounts, userId, saving, onClose, onConfirm }: Props) {
  const [accountId, setAccountId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setAccountId(accounts[0]?.id ?? null)
  }, [open])

  useEffect(() => {
    if (!open) return
    setAccountId((current) => {
      if (current != null && accounts.some((a) => a.id === current)) return current
      return accounts[0]?.id ?? current
    })
  }, [open, accounts])

  if (!bill) return null

  return (
    <Modal
      open={open}
      title={`Pagar "${bill.name}"`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button block loading={saving} onClick={() => void onConfirm(accountId)}>
            Pagar {formatBRL(bill.amt)}
          </Button>
        </>
      }
    >
      <p className={styles.text}>
        Vou registrar o pagamento de <b>{formatBRL(bill.amt)}</b> e lançar um gasto.
      </p>
      <AccountPicker
        label="De qual conta sai?"
        accounts={accounts}
        value={accountId}
        onChange={setAccountId}
        userId={userId}
      />
    </Modal>
  )
}
