// Edge Function: abre o Billing Portal do Stripe para o usuário gerenciar
// (trocar cartão, ver faturas, cancelar) a própria assinatura.
//
// Segredos: STRIPE_SECRET_KEY, APP_URL
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, json } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

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
    const { data: planRow } = await admin
      .from('plans')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const customerId = planRow?.stripe_customer_id as string | null
    if (!customerId) return json({ error: 'Nenhuma assinatura encontrada' }, 404)

    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173'
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/app`,
    })

    return json({ url: session.url })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro ao abrir portal' }, 500)
  }
})
