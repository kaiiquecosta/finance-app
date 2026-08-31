import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  billingChannel,
  fetchPlayProductQuotes,
  restorePurchases,
  startProCheckout,
  type PlayProductQuote,
} from '@/data/billing'
import type { BillingInterval } from '@/domain/pricing'
import {
  PRO_ANNUAL_TOTAL_BRL,
  PRO_MONTHLY_BRL,
  annualSavingsPercent,
  formatPriceBRL,
} from '@/domain/pricing'
import { isGooglePlayBilling } from '@/lib/billingPlatform'
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
  onSuccess?: () => void
}

export function UpgradeModal({ open, onClose, trialDaysLeft = 0, onSuccess }: Props) {
  const [interval, setInterval] = useState<BillingInterval>('year')
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState('')
  const [playQuotes, setPlayQuotes] = useState<PlayProductQuote[]>([])
  const googlePlay = isGooglePlayBilling()
  const savings = annualSavingsPercent()

  useEffect(() => {
    if (!open || !googlePlay) return
    let active = true
    fetchPlayProductQuotes()
      .then((quotes) => {
        if (active) setPlayQuotes(quotes)
      })
      .catch(() => {
        if (active) setPlayQuotes([])
      })
    return () => {
      active = false
    }
  }, [open, googlePlay])

  const playQuote = (kind: BillingInterval) =>
    playQuotes.find((q) => q.interval === kind)

  const upgrade = async () => {
    setError('')
    setLoading(true)
    try {
      await startProCheckout(interval)
      onSuccess?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir a assinatura.')
    } finally {
      setLoading(false)
    }
  }

  const restore = async () => {
    setError('')
    setRestoring(true)
    try {
      const ok = await restorePurchases()
      if (!ok) {
        setError('Nenhuma assinatura ativa encontrada nesta conta Google.')
        return
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível restaurar compras.')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <Modal
      open={open}
      title="✦ Flux Pro"
      onClose={onClose}
      footer={
        <>
          {googlePlay ? (
            <Button variant="ghost" onClick={() => void restore()} disabled={loading || restoring}>
              Restaurar compras
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Agora não
            </Button>
          )}
          <Button block loading={loading} onClick={() => void upgrade()}>
            {googlePlay ? 'Assinar na Play Store' : 'Assinar Pro'}
          </Button>
        </>
      }
    >
      {trialDaysLeft > 0 && (
        <p className={styles.trial}>
          Você está no período de teste — <b>{trialDaysLeft} dia(s)</b> restantes com tudo liberado.
        </p>
      )}

      <p className={styles.intro}>
        {googlePlay
          ? 'Assinatura pela Google Play — cobrança na sua conta Google.'
          : 'Escolha como prefere pagar depois do trial (ou agora, se quiser):'}
      </p>

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
            {googlePlay
              ? (playQuote('year')?.priceString ?? '…')
              : `R$ ${formatPriceBRL(PRO_ANNUAL_TOTAL_BRL / 12)}`}
            {!googlePlay && <small>/mês</small>}
          </span>
          <span className={styles.planSub}>
            {googlePlay ? 'Plano anual na Play Store' : 'Plano anual · cancele quando quiser'}
          </span>
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
            {googlePlay
              ? (playQuote('month')?.priceString ?? '…')
              : `R$ ${formatPriceBRL(PRO_MONTHLY_BRL)}`}
            {!googlePlay && <small>/mês</small>}
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
        30 dias grátis no cadastro ·{' '}
        {googlePlay
          ? `pagamento via ${billingChannel() === 'google_play' ? 'Google Play' : 'Stripe'}`
          : 'pagamento seguro via Stripe'}
        {' · '}cancele quando quiser.
      </p>
    </Modal>
  )
}
