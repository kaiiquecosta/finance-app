import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/MoneyField'
import { formatBRL, ZERO, type Cents } from '@/domain/money'
import { calcInvestment, DEFAULT_RATES, type MarketRates } from '@/domain/calc/investment'
import type { BankAccount, Investment } from '@/domain/entities'
import styles from './RescueModal.module.css'

interface Props {
  open: boolean
  investment: Investment | null
  accounts: BankAccount[]
  rates?: MarketRates
  saving?: boolean
  onClose: () => void
  onConfirm: (input: { amount: Cents; accountId: number | null }) => Promise<void>
}

export function RescueModal({ open, investment, accounts, rates, saving, onClose, onConfirm }: Props) {
  const [amount, setAmount] = useState<Cents>(ZERO)
  const [accountId, setAccountId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount(ZERO)
    setAccountId(accounts[0]?.id ?? null)
    setError('')
  }, [open, accounts])

  if (!investment) return null

  const result = calcInvestment(
    {
      amount: investment.amount,
      type: investment.type,
      date: investment.date,
      pct: investment.pct,
      spread: investment.spread,
      yield: investment.yield,
    },
    new Date(),
    rates ?? DEFAULT_RATES,
  )

  const submit = async (value: Cents) => {
    setError('')
    if (value <= 0) return setError('Informe um valor maior que zero.')
    try {
      await onConfirm({ amount: value, accountId })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível resgatar.')
    }
  }

  return (
    <Modal
      open={open}
      title={`💰 Resgatar "${investment.name}"`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button block loading={saving} onClick={() => void submit(amount)}>
            Resgatar {formatBRL(amount)}
          </Button>
        </>
      }
    >
      <p className={styles.context}>
        Valor líquido disponível: <b>{formatBRL(result.netAmount)}</b>
      </p>

      <MoneyField label="Quanto resgatar?" value={amount} onChange={setAmount} autoFocus />

      <Button variant="ghost" block onClick={() => void submit(result.netAmount)} disabled={saving}>
        Resgatar tudo ({formatBRL(result.netAmount)})
      </Button>

      {accounts.length > 0 && (
        <div>
          <span className={styles.label}>Para qual conta vai?</span>
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

      {amount > 0 && amount < result.netAmount && (
        <p className={styles.hint}>
          Resgate parcial: o principal restante é reduzido proporcionalmente ao valor sacado.
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
