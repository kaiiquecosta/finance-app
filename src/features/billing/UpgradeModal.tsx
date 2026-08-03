import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { startCheckout } from '@/data/billing'
import styles from './UpgradeModal.module.css'

const BENEFITS = [
  '📈 Investimentos com mercado ao vivo',
  '🎯 Metas ilimitadas',
  '💳 Cartões e adianto de parcelas',
  '🔔 Lembretes de contas e assinaturas',
  '☁️ Backup e sincronização na nuvem',
]

interface Props {
  open: boolean
  onClose: () => void
  trialDaysLeft?: number
}

export function UpgradeModal({ open, onClose, trialDaysLeft = 0 }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const upgrade = async () => {
    setError('')
    setLoading(true)
    try {
      await startCheckout() // redireciona para o Stripe
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar o checkout.')
      setLoading(false)
    }
  }

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
          Você está no período de teste — <b>{trialDaysLeft} dia(s)</b> restantes.
        </p>
      )}
      <p className={styles.intro}>Desbloqueie tudo e mantenha suas finanças sempre em dia:</p>
      <ul className={styles.list}>
        {BENEFITS.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {error && <p className={styles.error}>{error}</p>}
      <p className={styles.note}>Pagamento seguro via Stripe · cancele quando quiser.</p>
    </Modal>
  )
}
