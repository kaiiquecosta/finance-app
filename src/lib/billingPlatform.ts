import { Capacitor } from '@capacitor/core'

export type BillingChannel = 'stripe' | 'google_play'

/** Web/desktop → Stripe. Android nativo → Google Play Billing. */
export function billingChannel(): BillingChannel {
  if (Capacitor.getPlatform() === 'android') return 'google_play'
  return 'stripe'
}

export function isGooglePlayBilling(): boolean {
  return billingChannel() === 'google_play'
}

export function isStripeBilling(): boolean {
  return billingChannel() === 'stripe'
}
