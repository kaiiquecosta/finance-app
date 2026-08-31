import { getGooglePlayAccessToken } from './googlePlayAuth.ts'

export interface GooglePlaySubscriptionStatus {
  active: boolean
  expiryTime: string | null
  productId: string | null
  basePlanId: string | null
  subscriptionState: string | null
}

/** Valida token de assinatura via Subscriptions v2 (Google Play Developer API). */
export async function verifyGooglePlaySubscription(
  purchaseToken: string,
): Promise<GooglePlaySubscriptionStatus> {
  const packageName = Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME') ?? 'com.finance.app'
  const accessToken = await getGooglePlayAccessToken()

  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Play API ${res.status}: ${body}`)
  }

  const data = (await res.json()) as {
    subscriptionState?: string
    lineItems?: Array<{
      productId?: string
      offerDetails?: { basePlanId?: string }
      expiryTime?: string
    }>
  }

  const state = data.subscriptionState ?? null
  const line = data.lineItems?.[0]
  const expiryTime = line?.expiryTime ?? null
  const active =
    state === 'SUBSCRIPTION_STATE_ACTIVE' ||
    state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' ||
    state === 'SUBSCRIPTION_STATE_ON_HOLD'

  return {
    active,
    expiryTime,
    productId: line?.productId ?? null,
    basePlanId: line?.offerDetails?.basePlanId ?? null,
    subscriptionState: state,
  }
}
