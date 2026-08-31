/**
 * Google Play Billing (Android) via @capgo/native-purchases + verificação no Supabase.
 */
import type { BillingInterval } from '@/domain/pricing'
import {
  GOOGLE_PLAY_PLAN_ANNUAL,
  GOOGLE_PLAY_PLAN_MONTHLY,
  GOOGLE_PLAY_PRODUCT_ID,
  playBasePlanId,
  type PlayBillingInterval,
} from '@/domain/playBilling'
import { isGooglePlayBilling } from '@/lib/billingPlatform'
import { supabase } from './supabase'

export interface PlayProductQuote {
  interval: PlayBillingInterval
  priceString: string
  title: string
}

async function loadNativePurchases() {
  const mod = await import('@capgo/native-purchases')
  return { NativePurchases: mod.NativePurchases, PURCHASE_TYPE: mod.PURCHASE_TYPE }
}

export async function isPlayBillingAvailable(): Promise<boolean> {
  if (!isGooglePlayBilling()) return false
  try {
    const { NativePurchases } = await loadNativePurchases()
    const { isBillingSupported } = await NativePurchases.isBillingSupported()
    return Boolean(isBillingSupported)
  } catch {
    return false
  }
}

/** Preços localizados vindos da Play Store (obrigatório exibir estes valores). */
export async function fetchPlayProductQuotes(): Promise<PlayProductQuote[]> {
  const { NativePurchases, PURCHASE_TYPE } = await loadNativePurchases()
  const { products } = await NativePurchases.getProducts({
    productIdentifiers: [GOOGLE_PLAY_PRODUCT_ID],
    productType: PURCHASE_TYPE.SUBS,
  })

  const quotes: PlayProductQuote[] = []

  for (const product of products ?? []) {
    const basePlanId = product.identifier
    if (basePlanId === GOOGLE_PLAY_PLAN_MONTHLY) {
      quotes.push({
        interval: 'month',
        priceString: product.priceString,
        title: product.title,
      })
    } else if (basePlanId === GOOGLE_PLAY_PLAN_ANNUAL) {
      quotes.push({
        interval: 'year',
        priceString: product.priceString,
        title: product.title,
      })
    }
  }

  return quotes
}

async function verifyOnServer(input: {
  purchaseToken: string
  productId: string
  basePlanId: string
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean
    error?: string
    active?: boolean
  }>('google-play-verify', { body: input })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!data?.ok || !data.active) throw new Error('Assinatura não confirmada pela Google Play.')
}

export async function purchasePlaySubscription(interval: BillingInterval): Promise<void> {
  const playInterval: PlayBillingInterval = interval === 'year' ? 'year' : 'month'
  const basePlanId = playBasePlanId(playInterval)
  const { NativePurchases, PURCHASE_TYPE } = await loadNativePurchases()

  const result = await NativePurchases.purchaseProduct({
    productIdentifier: GOOGLE_PLAY_PRODUCT_ID,
    planIdentifier: basePlanId,
    productType: PURCHASE_TYPE.SUBS,
  })

  const token = result.purchaseToken
  if (!token) throw new Error('Compra concluída, mas sem token da Play Store.')

  await verifyOnServer({
    purchaseToken: token,
    productId: GOOGLE_PLAY_PRODUCT_ID,
    basePlanId,
  })
}

/** Re-sincroniza assinaturas já compradas neste dispositivo/conta Google. */
export async function restorePlayPurchases(): Promise<boolean> {
  const { NativePurchases, PURCHASE_TYPE } = await loadNativePurchases()
  await NativePurchases.restorePurchases()
  const { purchases } = await NativePurchases.getPurchases({
    productType: PURCHASE_TYPE.SUBS,
    onlyCurrentEntitlements: true,
  })

  const active = purchases?.find((p) => p.isActive && p.purchaseToken)
  if (!active?.purchaseToken) return false

  await verifyOnServer({
    purchaseToken: active.purchaseToken,
    productId: active.productIdentifier ?? GOOGLE_PLAY_PRODUCT_ID,
    basePlanId: playBasePlanId('month'),
  })
  return true
}

export async function openPlaySubscriptionManagement(): Promise<void> {
  const { NativePurchases } = await loadNativePurchases()
  await NativePurchases.manageSubscriptions()
}
