/**
 * IDs de assinatura Google Play (Play Console).
 * Um produto `flux_pro` com base plans `monthly` e `annual`.
 */
export const GOOGLE_PLAY_PRODUCT_ID =
  (import.meta.env.VITE_GOOGLE_PLAY_PRODUCT_ID as string | undefined)?.trim() || 'flux_pro'

export const GOOGLE_PLAY_PLAN_MONTHLY =
  (import.meta.env.VITE_GOOGLE_PLAY_PLAN_MONTHLY as string | undefined)?.trim() || 'monthly'

export const GOOGLE_PLAY_PLAN_ANNUAL =
  (import.meta.env.VITE_GOOGLE_PLAY_PLAN_ANNUAL as string | undefined)?.trim() || 'annual'

export type PlayBillingInterval = 'month' | 'year'

export function playBasePlanId(interval: PlayBillingInterval): string {
  return interval === 'year' ? GOOGLE_PLAY_PLAN_ANNUAL : GOOGLE_PLAY_PLAN_MONTHLY
}
