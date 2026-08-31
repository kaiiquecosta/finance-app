# Billing — Web (Stripe) + Android (Google Play)

O Flux usa **dois canais de pagamento**, com **um único status Pro** na tabela `plans` do Supabase.

| Canal | Onde | Quem cobra | Dinheiro cai em |
|-------|------|------------|-----------------|
| **Stripe** | Site (Vercel), PWA, iOS futuro | Stripe Checkout | Conta Stripe → banco |
| **Google Play** | App Android (Capacitor) | Google Play Billing | Play Console → banco |

O app escolhe o canal automaticamente:

- `Capacitor.getPlatform() === 'android'` → Google Play  
- Demais plataformas → Stripe  

---

## Preços (referência de marketing)

| Plano | Web (Stripe) | Play Store (configure igual) |
|-------|--------------|------------------------------|
| Mensal | R$ 24,90/mês | Base plan `monthly` |
| Anual | R$ 19,99/mês (cobrança anual) | Base plan `annual` |

Na UI **não** exibimos o total anual (ex.: 239,88) — só o equivalente mensal no anual.

---

## 1. Stripe (web)

### Stripe Dashboard

1. Produto **Flux Pro**
2. Preços recorrentes BRL:
   - Mensal: R$ 24,90 → `STRIPE_PRICE_PRO_MONTHLY`
   - Anual: R$ 239,88/ano → `STRIPE_PRICE_PRO_ANNUAL`

### Supabase secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_PRICE_PRO_MONTHLY=price_...
supabase secrets set STRIPE_PRICE_PRO_ANNUAL=price_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set APP_URL=https://seu-dominio.com

supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy stripe-portal
```

Webhook atualiza `plans` via `stripe_customer_id`.

---

## 2. Google Play (Android)

### Play Console — assinaturas

1. **Monetização → Produtos → Assinaturas**
2. Criar assinatura **`flux_pro`** (ID = `VITE_GOOGLE_PLAY_PRODUCT_ID`)
3. Base plans:
   - **`monthly`** — R$ 24,90, renovação mensal
   - **`annual`** — R$ 19,99/mês, período de 1 ano

4. **License testing** — adicione e-mails de teste (compras não cobram de verdade)
5. Publique o app em **Internal testing** (obrigatório para testar billing)

### Google Cloud — API access

1. Play Console → **Setup → API access** → link projeto Google Cloud
2. Crie **Service Account** com papel *Finance* ou permissão Android Publisher
3. Baixe JSON da chave → secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (string JSON completa)

### Supabase

```bash
supabase secrets set GOOGLE_PLAY_PACKAGE_NAME=com.finance.app
supabase secrets set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

supabase functions deploy google-play-verify
```

Migration `0010_billing_google_play.sql` adiciona colunas `billing_provider`, `google_*`.

### Fluxo no app

1. Usuário toca **Assinar na Play Store**
2. Plugin `@capgo/native-purchases` abre fluxo nativo
3. App envia `purchaseToken` → Edge Function `google-play-verify`
4. Servidor valida na **Android Publisher API** e grava `plan=pro`

**Restaurar compras** revalida token ativo (mesma função).

**Gerenciar assinatura** abre tela nativa Google (`manageSubscriptions`).

---

## 3. Variáveis Vite (frontend)

```env
VITE_GOOGLE_PLAY_PRODUCT_ID=flux_pro
VITE_GOOGLE_PLAY_PLAN_MONTHLY=monthly
VITE_GOOGLE_PLAY_PLAN_ANNUAL=annual
```

Mesmas envs no build Android (`npm run cap:sync`).

---

## 4. Banco — tabela `plans`

| Campo | Stripe | Google Play |
|-------|--------|-------------|
| `billing_provider` | `stripe` | `google_play` |
| `stripe_sub_id` | ✓ | — |
| `google_purchase_token` | — | ✓ |
| `current_period_end` | fim do período | `expiryTime` da API |

Trial 30 dias continua igual para todos (trigger no cadastro).

---

## 5. Checklist de teste

### Web

- [ ] Assinar mensal e anual (Stripe test mode `4242…`)
- [ ] Webhook grava `plan=pro`
- [ ] Portal Stripe cancela/reativa

### Android (Internal testing)

- [ ] App instalado **pela Play Store** (não sideload APK)
- [ ] Conta Google em License testers
- [ ] Preços da Play aparecem no modal (não hardcoded)
- [ ] Compra mensal/anual → Pro ativo
- [ ] Restaurar compras funciona
- [ ] Gerenciar assinatura abre Play

---

## 6. Política Google

Assinaturas digitais **dentro** do app Android publicado na Play Store devem usar **Google Play Billing** — implementado neste repo.

O site continua com Stripe. Evite linkar checkout Stripe **dentro** do app Android como caminho principal de upgrade.

---

## Arquivos principais

- `src/lib/billingPlatform.ts` — roteamento web vs Android
- `src/data/billing.ts` — API unificada
- `src/data/playBilling.ts` — plugin nativo + verify
- `supabase/functions/google-play-verify/` — validação server-side
- `supabase/functions/stripe-*` — web
