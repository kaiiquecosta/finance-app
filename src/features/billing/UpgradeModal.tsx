import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { startCheckout } from '@/data/billing'
import type { BillingInterval } from '@/domain/pricing'
import {
  PRO_ANNUAL_TOTAL_BRL,
  PRO_MONTHLY_BRL,
  annualSavingsPercent,
  formatPriceBRL,
} from '@/domain/pricing'
import styles from './UpgradeModal.module.css'

const BENEFITS = [
  '📈 Investidor com cotações ao vivo e favoritos',
  '🎯 Metas, cartões e transações ilimitadas',
  '💳 Importação OFX e Open Finance',
  '🎙️ Assistente com voz ilimitado',
  '🔔 Lembretes e exportação de dados',
]

interface Props {
  open: boolean
  onClose: () => void
  trialDaysLeft?: number
}

export function UpgradeModal({ open, onClose, trialDaysLeft = 0 }: Props) {
  const [interval, setInterval] = useState<BillingInterval>('year')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const upgrade = async () => {
    setError('')
    setLoading(true)
    try {
      await startCheckout(interval)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar o checkout.')
      setLoading(false)
    }
  }

  const savings = annualSavingsPercent()

  return (
    <Modal
      open={open}
      title="✦ Flux Pro"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Agora não
          </Button>
          <Button block loading={loading} onClick={() => void upgrade()}>
            Assinar Pro
          </Button>
        </>
      }
    >
      {trialDaysLeft > 0 && (
        <p className={styles.trial}>
          Você está no período de teste — <b>{trialDaysLeft} dia(s)</b> restantes com tudo liberado.
        </p>
      )}
      <p className={styles.intro}>Escolha como prefere pagar depois do trial (ou agora, se quiser):</p>

      <div className={styles.plans} role="radiogroup" aria-label="Plano Pro">
        <button
          type="button"
          role="radio"
          aria-checked={interval === 'year'}
          className={[styles.plan, interval === 'year' ? styles.planActive : ''].filter(Boolean).join(' ')}
          onClick={() => setInterval('year')}
        >
          <span className={styles.planBadge}>Recomendado · −{savings}%</span>
          <span className={styles.planTitle}>Anual</span>
          <span className={styles.planPrice}>
            R$ {formatPriceBRL(PRO_ANNUAL_TOTAL_BRL / 12)}
            <small>/mês</small>
          </span>
          <span className={styles.planSub}>Cobrado {formatPriceBRL(PRO_ANNUAL_TOTAL_BRL)}/ano</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={interval === 'month'}
          className={[styles.plan, interval === 'month' ? styles.planActive : ''].filter(Boolean).join(' ')}
          onClick={() => setInterval('month')}
        >
          <span className={styles.planTitle}>Mensal</span>
          <span className={styles.planPrice}>
            R$ {formatPriceBRL(PRO_MONTHLY_BRL)}
            <small>/mês</small>
          </span>
          <span className={styles.planSub}>Cancele quando quiser</span>
        </button>
      </div>

      <ul className={styles.list}>
        {BENEFITS.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {error && <p className={styles.error}>{error}</p>}
      <p className={styles.note}>
        30 dias grátis no cadastro · pagamento seguro via Stripe · cancele quando quiser.
      </p>
    </Modal>
  )
}
