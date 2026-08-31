import { useState, type ReactNode } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { usePlan } from '@/data/hooks'
import { isPro, trialDaysLeft } from '@/domain/plan'
import { formatPriceBRL, PRO_ANNUAL_TOTAL_BRL } from '@/domain/pricing'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UpgradeModal } from './UpgradeModal'
import styles from './ProGate.module.css'

interface Props {
  feature: string
  icon: string
  description: string
  children: ReactNode
}

/**
 * Bloqueia uma página/recurso para quem não tem Pro (nem trial ativo),
 * mostrando um convite para assinar em vez do conteúdo. `isPro` já cobre os
 * 30 dias de trial — novos cadastros e usuários existentes dentro do
 * período veem o recurso normalmente.
 */
export function ProGate({ feature, icon, description, children }: Props) {
  const { user } = useAuth()
  const plan = usePlan(user?.id)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  if (plan.isLoading) return null
  if (isPro(plan.data)) return <>{children}</>

  return (
    <>
      <PageHeader title={feature} subtitle="Recurso Pro" />
      <Card className={styles.card}>
        <span className={styles.icon}>{icon}</span>
        <h2 className={styles.title}>{feature} é um recurso Pro</h2>
        <p className={styles.desc}>{description}</p>
        <Button onClick={() => setUpgradeOpen(true)}>Assinar Pro</Button>
        <p className={styles.hint}>
          🎁 Todo novo cadastro tem <b>30 dias grátis</b> com tudo liberado. Depois, Pro a partir de{' '}
          <b>R$ {formatPriceBRL(PRO_ANNUAL_TOTAL_BRL / 12)}/mês</b> no anual.
        </p>
      </Card>
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        trialDaysLeft={trialDaysLeft(plan.data)}
      />
    </>
  )
}
