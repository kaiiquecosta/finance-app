// Edge Function: cria uma sessão de Checkout do Stripe para assinar o Pro.
// Chamada pelo app (usuário autenticado). A chave secreta fica só aqui, no servidor.
//
// Segredos necessários (supabase secrets set):
//   STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, APP_URL
// Disponíveis automaticamente no runtime:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
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

    // Identifica o usuário a partir do JWT enviado pelo app.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Sessão inválida' }, 401)

    // Cliente admin (service_role) para ler/gravar a tabela plans (ignora RLS).
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Reutiliza o customer do Stripe se já existir; senão cria e guarda.
    const { data: planRow } = await admin
      .from('plans')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = planRow?.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await admin
        .from('plans')
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' })
    }

    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: Deno.env.get('STRIPE_PRICE_PRO')!, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/app?checkout=success`,
      cancel_url: `${appUrl}/app?checkout=cancel`,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
    })

    return json({ url: session.url })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro ao criar checkout' }, 500)
  }
})
