// Edge Function: recebe webhooks do Stripe e atualiza a tabela `plans`.
// É AQUI que o Pro é concedido — via service_role (ignora RLS). O cliente
// NUNCA escreve em `plans`, então ninguém consegue se tornar Pro de graça.
//
// Segredos: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// Importante: esta função deve rodar SEM verificação de JWT
//   supabase functions deploy stripe-webhook --no-verify-jwt
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

async function applySubscription(customerId: string, sub: Stripe.Subscription) {
  const active = sub.status === 'active' || sub.status === 'trialing'
  await admin
    .from('plans')
    .update({
      plan: active ? 'pro' : 'free',
      status: sub.status,
      stripe_sub_id: sub.id,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  if (!signature) return new Response('Sem assinatura', { status: 400 })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    )
  } catch (e) {
    return new Response(`Webhook inválido: ${e instanceof Error ? e.message : e}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        if (s.subscription) {
          const sub = await stripe.subscriptions.retrieve(String(s.subscription))
          await applySubscription(String(s.customer), sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await applySubscription(String(sub.customer), sub)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await admin
          .from('plans')
          .update({
            plan: 'free',
            status: 'canceled',
            stripe_sub_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', String(sub.customer))
        break
      }
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (e) {
    return new Response(`Erro no handler: ${e instanceof Error ? e.message : e}`, { status: 500 })
  }
})
