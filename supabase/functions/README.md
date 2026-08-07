# Edge Functions — Pagamentos (Stripe)

Backend seguro do plano Pro. A **chave secreta do Stripe fica só aqui**, no servidor.
O cliente nunca escreve na tabela `plans` — quem concede o Pro é o `stripe-webhook`
(via `service_role`, que ignora o RLS).

```
functions/
├─ _shared/cors.ts        # headers CORS + helper json()
├─ _shared/pluggyClient.ts # cliente HTTP Pluggy (Edge only)
├─ stripe-checkout/       # cria a sessão de Checkout (assinar)
├─ stripe-webhook/        # recebe eventos do Stripe e atualiza `plans`
├─ stripe-portal/         # abre o Billing Portal (gerenciar/cancelar)
├─ delete-account/        # LGPD: cancela assinatura + apaga o usuário
├─ pluggy-register-item/  # registra Item ID (Meu Pluggy / Connect)
├─ pluggy-sync/           # contas + transações → Postgres
└─ pluggy-connect-token/  # token do widget Connect (Fase 2)
└─ speech-transcribe/     # Whisper — áudio do assistente (Firefox/PWA)
```

Assistente de voz: ver **`docs/SPEECH.md`**. Deploy:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy speech-transcribe
```

## Open Finance

```bash
supabase secrets set PLUGGY_CLIENT_ID=...
supabase secrets set PLUGGY_CLIENT_SECRET=...
supabase functions deploy pluggy-register-item pluggy-sync pluggy-connect-token
```

## 1. Pré-requisitos no Stripe (dashboard.stripe.com)

1. **Produto + preço**: crie um produto "Finance Pro" com um **preço recorrente** (ex.: R$ 14/mês).
   Copie o **Price ID** (`price_...`).
2. **Chave secreta**: Developers → API keys → **Secret key** (`sk_...`).

## 2. Configurar e publicar (Supabase CLI)

```bash
npm i -g supabase
supabase login
supabase link --project-ref rxireyhmphkybjvqbawf

# Segredos (nunca vão pro git nem pro frontend)
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_PRICE_PRO=price_...
supabase secrets set APP_URL=https://finance-app-one-weld.vercel.app

# Publicar as funções
supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook --no-verify-jwt   # webhook NÃO usa JWT
supabase functions deploy delete-account
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem
> automaticamente no runtime das funções — não precisa setar.

## 3. Registrar o webhook no Stripe

1. Dashboard → Developers → **Webhooks** → *Add endpoint*
2. URL: `https://rxireyhmphkybjvqbawf.functions.supabase.co/stripe-webhook`
3. Eventos: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`
4. Copie o **Signing secret** (`whsec_...`) e configure:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase functions deploy stripe-webhook --no-verify-jwt
```

## 4. Testar

- No app: badge do plano → **Assinar Pro** → Checkout do Stripe (use o cartão de teste
  `4242 4242 4242 4242`). Ao concluir, o webhook grava `plan=pro` em `plans` e o app
  reflete em alguns segundos.
- Gerenciar/cancelar: badge **PRO** → abre o Billing Portal.

## Notas

- Enquanto estiver em teste, use chaves `sk_test_...` e cartões de teste. Em produção,
  troque para as chaves `live` e re-depoloye.
- A tabela `plans` e o trial de 30 dias no cadastro já vêm do `migrations/0001_schema.sql`.
