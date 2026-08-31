/**
 * Pagamentos unificados: Stripe (web) + Google Play (Android).
 */
import type { BillingInterval } from '@/domain/pricing'
import { billingChannel } from '@/lib/billingPlatform'
import { supabase } from './supabase'
import {
  isPlayBillingAvailable,
  openPlaySubscriptionManagement,
  purchasePlaySubscription,
  restorePlayPurchases,
} from './playBilling'

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

/** Inicia assinatura Pro no canal correto (Play Store ou Stripe). */
export async function startProCheckout(interval: BillingInterval = 'year'): Promise<void> {
  if (billingChannel() === 'google_play') {
    const ok = await isPlayBillingAvailable()
    if (!ok) {
      throw new Error(
        'Compras in-app indisponíveis. Instale o app pela Play Store (teste interno) com conta de teste.',
      )
    }
    await purchasePlaySubscription(interval)
    return
  }
  await invokeRedirect('stripe-checkout', { interval })
}

/** @deprecated Use startProCheckout */
export function startCheckout(interval: BillingInterval = 'year'): Promise<void> {
  return startProCheckout(interval)
}

/** Gerencia/cancela assinatura no provedor ativo. */
export async function openSubscriptionManagement(): Promise<void> {
  if (billingChannel() === 'google_play') {
    await openPlaySubscriptionManagement()
    return
  }
  await invokeRedirect('stripe-portal')
}

/** @deprecated Use openSubscriptionManagement */
export function openBillingPortal(): Promise<void> {
  return openSubscriptionManagement()
}

export async function restorePurchases(): Promise<boolean> {
  if (billingChannel() !== 'google_play') return false
  return restorePlayPurchases()
}

export { billingChannel } from '@/lib/billingPlatform'
export { fetchPlayProductQuotes, type PlayProductQuote } from './playBilling'
