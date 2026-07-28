/**
 * Chamadas às Edge Functions de pagamento. O `invoke` do supabase-js já envia
 * o JWT do usuário no Authorization, então a função identifica quem está pagando.
 */
import { supabase } from './supabase'

async function invokeRedirect(fn: 'stripe-checkout' | 'stripe-portal'): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(fn)
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!data?.url) throw new Error('Resposta inválida do servidor de pagamento.')
  window.location.href = data.url
}

/** Redireciona para o Checkout do Stripe (assinar o Pro). */
export function startCheckout(): Promise<void> {
  return invokeRedirect('stripe-checkout')
}

/** Redireciona para o Billing Portal do Stripe (gerenciar/cancelar). */
export function openBillingPortal(): Promise<void> {
  return invokeRedirect('stripe-portal')
}
