import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/domain/money'
import type { BankAccount, FixedBill } from '@/domain/entities'
import styles from './PayBillModal.module.css'

interface Props {
  open: boolean
  bill: FixedBill | null
  accounts: BankAccount[]
  saving?: boolean
  onClose: () => void
  onConfirm: (accountId: number | null) => Promise<void>
}

export function PayBillModal({ open, bill, accounts, saving, onClose, onConfirm }: Props) {
  const [accountId, setAccountId] = useState<number | null>(null)

  useEffect(() => {
    if (open) setAccountId(accounts[0]?.id ?? null)
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
      {accounts.length > 0 && (
        <div>
          <span className={styles.label}>De qual conta sai?</span>
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
    </Modal>
  )
}
