/**
 * Valida compra/assinatura Google Play e grava Pro em `plans`.
 * Chamada pelo app Android após purchaseProduct ou restorePurchases.
 *
 * Segredos:
 *   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON — JSON da service account (Play Console → API access)
 *   GOOGLE_PLAY_PACKAGE_NAME — com.finance.app
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, json } from '../_shared/cors.ts'
import { verifyGooglePlaySubscription } from '../_shared/googlePlayVerify.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Sessão inválida' }, 401)

    const body = (await req.json()) as {
      purchaseToken?: string
      productId?: string
      basePlanId?: string
    }
    const purchaseToken = body.purchaseToken?.trim()
    if (!purchaseToken) return json({ error: 'purchaseToken obrigatório' }, 400)

    const status = await verifyGooglePlaySubscription(purchaseToken)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const patch = {
      plan: status.active ? 'pro' : 'free',
      status: status.active ? 'active' : 'canceled',
      billing_provider: status.active ? 'google_play' : null,
      google_product_id: body.productId ?? status.productId,
      google_base_plan_id: body.basePlanId ?? status.basePlanId,
      google_purchase_token: purchaseToken,
      current_period_end: status.expiryTime,
      updated_at: new Date().toISOString(),
    }

    await admin.from('plans').upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' })

    return json({
      ok: true,
      active: status.active,
      expiryTime: status.expiryTime,
      subscriptionState: status.subscriptionState,
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro na verificação' }, 500)
  }
})
