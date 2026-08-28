import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/MoneyField'
import { formatBRL, ZERO, type Cents } from '@/domain/money'
import { calcInvestment, DEFAULT_RATES, type MarketRates } from '@/domain/calc/investment'
import type { BankAccount, Investment } from '@/domain/entities'
import { toInvestmentCalcInput } from '@/features/investments/investmentCalc'
import { AccountPicker } from '@/components/accounts/AccountPicker'
import styles from './RescueModal.module.css'

interface Props {
  open: boolean
  investment: Investment | null
  accounts: BankAccount[]
  userId: string | undefined
  rates?: MarketRates
  currentPrice?: number | null
  saving?: boolean
  onClose: () => void
  onConfirm: (input: { amount: Cents; accountId: number | null }) => Promise<void>
}

export function RescueModal({ open, investment, accounts, userId, rates, currentPrice, saving, onClose, onConfirm }: Props) {
  const [amount, setAmount] = useState<Cents>(ZERO)
  const [accountId, setAccountId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount(ZERO)
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

  if (!investment) return null

  const result = calcInvestment(
    toInvestmentCalcInput(investment, currentPrice),
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

      <AccountPicker
        label="Para qual conta vai?"
        accounts={accounts}
        value={accountId}
        onChange={setAccountId}
        userId={userId}
      />

      {amount > 0 && amount < result.netAmount && (
        <p className={styles.hint}>
          Resgate parcial: o principal restante é reduzido proporcionalmente ao valor sacado.
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
