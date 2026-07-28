/**
 * Regras de acesso ao Pro (puras). A fonte da verdade é a tabela `plans`
 * (escrita só pelo servidor via webhook do Stripe); aqui só interpretamos.
 */
import type { Plan } from './entities'

/** true se o usuário tem acesso Pro agora (assinatura ativa ou trial vigente). */
export function isPro(plan: Plan | null | undefined, now: Date = new Date()): boolean {
  if (!plan) return false
  if (plan.plan === 'pro' && plan.status === 'active') return true
  if (plan.status === 'trialing') {
    if (!plan.trialEndsAt) return true
    return new Date(plan.trialEndsAt).getTime() > now.getTime()
  }
  return false
}

/** Dias restantes de trial (0 se não estiver em trial ou já expirou). */
export function trialDaysLeft(plan: Plan | null | undefined, now: Date = new Date()): number {
  if (!plan || plan.status !== 'trialing' || !plan.trialEndsAt) return 0
  const ms = new Date(plan.trialEndsAt).getTime() - now.getTime()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

/** Rótulo curto do plano para a UI. */
export function planLabel(plan: Plan | null | undefined, now: Date = new Date()): 'PRO' | 'TRIAL' | 'FREE' {
  if (plan?.plan === 'pro' && plan.status === 'active') return 'PRO'
  if (isPro(plan, now)) return 'TRIAL'
  return 'FREE'
}
