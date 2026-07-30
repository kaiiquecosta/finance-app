// Edge Function: exclui a conta do usuário autenticado (LGPD, direito ao
// esquecimento). Usa service_role (ignora RLS) para:
//   1. Cancelar a assinatura no Stripe, se houver (best-effort).
//   2. Apagar o usuário em auth.users — todas as tabelas referenciam
//      auth.users(id) ON DELETE CASCADE, então profile/plans/dados
//      financeiros somem junto, numa única operação atômica no banco.
//
// Segredos: STRIPE_SECRET_KEY (opcional — se ausente, pula o cancelamento)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, json } from '../_shared/cors.ts'

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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Cancela a assinatura no Stripe antes de apagar (evita cobrar quem já foi excluído).
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (stripeKey) {
      try {
        const { data: planRow } = await admin
          .from('plans')
          .select('stripe_sub_id')
          .eq('user_id', user.id)
          .maybeSingle()
        const subId = planRow?.stripe_sub_id as string | null
        if (subId) {
          const Stripe = (await import('https://esm.sh/stripe@16.12.0?target=deno')).default
          const stripe = new Stripe(stripeKey, {
            apiVersion: '2024-06-20',
            httpClient: Stripe.createFetchHttpClient(),
          })
          await stripe.subscriptions.cancel(subId)
        }
      } catch {
        // Best-effort: não bloqueia a exclusão se o cancelamento falhar.
      }
    }

    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) return json({ error: error.message }, 500)

    return json({ ok: true })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro ao excluir a conta' }, 500)
  }
})
