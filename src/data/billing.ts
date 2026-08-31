/**
 * Chamadas às Edge Functions de pagamento. O `invoke` do supabase-js já envia
 * o JWT do usuário no Authorization, então a função identifica quem está pagando.
 */
import type { BillingInterval } from '@/domain/pricing'
import { supabase } from './supabase'

async function invokeRedirect(
  fn: 'stripe-checkout' | 'stripe-portal',
  body?: { interval?: BillingInterval },
): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(fn, {
    body,
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!data?.url) throw new Error('Resposta inválida do servidor de pagamento.')
  window.location.href = data.url
}

/** Redireciona para o Checkout do Stripe (assinar o Pro). */
export function startCheckout(interval: BillingInterval = 'year'): Promise<void> {
  return invokeRedirect('stripe-checkout', { interval })
}

/** Redireciona para o Billing Portal do Stripe (gerenciar/cancelar). */
export function openBillingPortal(): Promise<void> {
  return invokeRedirect('stripe-portal')
}
