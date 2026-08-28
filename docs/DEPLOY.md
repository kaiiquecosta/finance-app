# Deploy — Web (Vercel) + Supabase + Stripe + Google Play

Guia operacional para colocar o **Flux** em produção. Leia na ordem: unificar código → backend → web → billing → QA → Play Store.

**URLs de referência (ajuste para o seu domínio final):**

| Ambiente | URL |
| -------- | --- |
| Web produção | `https://finance-app-one-weld.vercel.app` |
| App (após login) | `https://finance-app-one-weld.vercel.app/app` |
| Política de privacidade | `https://finance-app-one-weld.vercel.app/privacidade` |
| Termos | `https://finance-app-one-weld.vercel.app/termos` |
| Supabase project ref (exemplo) | `rxireyhmphkybjvqbawf` |

---

## 0. Pré-requisito: unificar branches

**Não faça deploy de produção só da branch `feat/identidade-visual-legado`.** A `main` tem dezenas de commits à frente (assistente de voz, fixes mobile, PWA, Open Finance/Pluggy, comunidade realtime). Esta branch traz landing storytelling + importação OFX.

### Conflito de migrations (crítico)

| Branch | Arquivo `0005` | Próximo |
| ------ | -------------- | ------- |
| `main` | `0005_open_finance_pluggy.sql` | `0006_community_realtime.sql` |
| `feat/identidade-visual-legado` | `0005_card_bills_external_id.sql` | — |

**Resolução recomendada após merge:**

1. Manter `0005` e `0006` da `main` intactos.
2. Renomear `0005_card_bills_external_id.sql` → **`0007_card_bills_external_id.sql`**.
3. Rodar `supabase db push` (ou SQL Editor) na ordem numérica.

```bash
git fetch origin
git checkout main
git pull origin main
git merge feat/identidade-visual-legado
# resolver conflitos; renomear migration OFX para 0007
npm run test && npm run build
git push origin main
```

Detalhes das migrations: [`supabase/README.md`](../supabase/README.md).

---

## 1. Supabase (banco + auth)

### 1.1 Aplicar migrations

```bash
npx supabase login
npx supabase link --project-ref <SEU_PROJECT_REF>
npx supabase db push
```

Ordem esperada após unificação:

1. `0001_schema.sql`
2. `0002_plans_backfill.sql`
3. `0004_community.sql`
4. `0005_open_finance_pluggy.sql` *(só se usar Open Finance)*
5. `0006_community_realtime.sql`
6. `0007_card_bills_external_id.sql` *(OFX)*

Confira no SQL Editor: **Database → Tables** — todas as tabelas com RLS habilitado.

### 1.2 Auth — SMTP (obrigatório para produção)

O servidor de e-mail embutido do Supabase **não aguenta tráfego real**. Configure SMTP próprio:

1. Supabase → **Authentication** → **SMTP Settings**
2. Provedor sugerido: Resend, SendGrid, Amazon SES ou Postmark
3. Teste envio de OTP antes de abrir para usuários

Guia completo: [`docs/AUTH.md`](./AUTH.md).

### 1.3 Template de e-mail (código OTP)

1. Supabase → **Authentication** → **Email Templates** → **Magic Link**
2. Cole o conteúdo de [`supabase/email-templates/magic-link.html`](../supabase/email-templates/magic-link.html)
3. Assunto sugerido: `Seu código de acesso ao Flux`
4. Confirme que `{{ .Token }}` aparece no corpo

### 1.4 URL Configuration

Supabase → **Authentication** → **URL Configuration**:

| Campo | Valor |
| ----- | ----- |
| **Site URL** | `https://finance-app-one-weld.vercel.app` (ou domínio customizado) |
| **Redirect URLs** | `https://finance-app-one-weld.vercel.app/**` |
| | `http://localhost:5173/**` *(dev)* |
| | `com.finance.app://login-callback` *(Android/iOS — Google OAuth)* |

### 1.5 Google OAuth

Supabase → **Authentication** → **Providers** → Google:

- Client ID e Secret do [Google Cloud Console](https://console.cloud.google.com/)
- Authorized redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

---

## 2. Edge Functions (Stripe + LGPD)

Segredos **nunca** vão para o frontend nem para o git.

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_PRICE_PRO=price_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set APP_URL=https://finance-app-one-weld.vercel.app

supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy delete-account
```

### Webhook Stripe

1. [Stripe Dashboard](https://dashboard.stripe.com) → Developers → **Webhooks** → Add endpoint
2. URL: `https://<PROJECT_REF>.functions.supabase.co/stripe-webhook`
3. Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copie `whsec_...` → `supabase secrets set STRIPE_WEBHOOK_SECRET=...`
5. Re-deploy: `supabase functions deploy stripe-webhook --no-verify-jwt`

Guia detalhado: [`supabase/functions/README.md`](../supabase/functions/README.md).

### Teste de billing (antes de ir live)

1. Com chaves **test** (`sk_test_`, `pk_test_`): Assinar Pro → cartão `4242 4242 4242 4242`
2. Confirme `plans.plan = 'pro'` no Supabase após o webhook
3. Teste Billing Portal (cancelar/reativar)
4. Troque para chaves **live** e repita um checkout real de valor baixo

---

## 3. Vercel (frontend web)

### 3.1 Variáveis de ambiente

Vercel → Project → **Settings** → **Environment Variables** (Production):

| Variável | Onde obter |
| -------- | ---------- |
| `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API (anon/public) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys (`pk_live_...`) |
| `VITE_ADMIN_EMAILS` *(opcional)* | E-mails separados por vírgula — admin da Comunidade |
| `VITE_SENTRY_DSN` *(recomendado)* | Sentry → Project Settings → Client Keys |

Copie de [`.env.example`](../.env.example). **Nunca** commite `.env.local`.

### 3.2 Deploy

```bash
git push origin main
```

A Vercel faz deploy automático na branch conectada (geralmente `main`).

### 3.3 Headers de segurança

[`vercel.json`](../vercel.json) já define CSP, HSTS, `X-Frame-Options`, etc. Se adicionar domínios externos (ex.: Sentry, Pluggy), atualize `connect-src` no CSP.

### 3.4 Domínio customizado *(opcional)*

Vercel → Domains → adicione `app.seudominio.com.br` → atualize Site URL no Supabase e `APP_URL` nos secrets.

---

## 4. QA pré-lançamento web

Checklist mínimo manual (30–60 min):

- [ ] Cadastro por código OTP (e-mail chega, código funciona)
- [ ] Login Google (web)
- [ ] Trial 30 dias visível; bloqueio Pro após expirar *(se aplicável)*
- [ ] Checkout Stripe → webhook → badge PRO
- [ ] Exportar dados (LGPD) e fluxo de exclusão de conta
- [ ] `/privacidade` e `/termos` acessíveis sem login
- [ ] PWA: instalar no celular, login, navegação offline básica
- [ ] `npm run test` e `npm run build` verdes no CI/local

Testes automatizados:

```bash
npm run test          # unitários (Vitest)
npm run test:e2e      # Playwright (precisa app rodando)
npm run build
```

---

## 5. Google Play Store (Android)

O app Android usa **Capacitor**: o `dist/` do Vite roda dentro de uma WebView nativa. Guia mobile: [`docs/MOBILE.md`](./MOBILE.md).

### 5.1 Pré-requisitos

| Item | Detalhe |
| ---- | ------- |
| Node.js | **22+** para `cap sync` (tooling Capacitor) |
| Android Studio | Última stable + SDK 36 |
| Conta Google Play | [Play Console](https://play.google.com/console) — taxa única ~US$ 25 |
| Keystore | Arquivo `.jks` + senhas — **guarde backup offline; perder = não atualiza o app** |

Identificadores já no repo:

- **Application ID:** `com.finance.app`
- **App name:** Flux
- **Deep link OAuth:** `com.finance.app://login-callback` (já no `AndroidManifest.xml`)
- **versionCode / versionName:** `android/app/build.gradle` (hoje `1` / `"1.0"`)

### 5.2 Build de release (AAB assinado)

```bash
# Node 22+
node --version   # >= 22

# Variáveis de produção no build web (mesmas da Vercel)
export VITE_SUPABASE_URL=...
export VITE_SUPABASE_ANON_KEY=...
export VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

npm run cap:sync
npm run android:open
```

No **Android Studio**:

1. **Build → Generate Signed App Bundle / APK**
2. Escolha **Android App Bundle (.aab)**
3. Crie ou selecione o keystore (primeira vez: *Create new* → guarde alias e senhas)
4. Build variant: **release**
5. Saída: `android/app/release/app-release.aab`

> Incremente `versionCode` a cada upload na Play Store. `versionName` é o que o usuário vê (ex.: `1.0.0`).

### 5.3 Play Console — ficha da loja

Crie o app → **Production** (ou comece por **Internal testing**):

| Campo | Sugestão |
| ----- | -------- |
| Nome | Flux — Controle Financeiro |
| Descrição curta | Organize gastos, cartões, metas e investimentos |
| Descrição completa | Destaque trial 30 dias, módulos, segurança (RLS, Stripe) |
| Categoria | Finanças |
| Política de privacidade | `https://finance-app-one-weld.vercel.app/privacidade` |
| E-mail de contato | Seu e-mail de suporte |

**Screenshots obrigatórios:** phone (mín. 2), tablet 7" e 10" se suportar. Capture telas reais: dashboard, cartões, metas, login.

**Ícone:** 512×512 PNG — pode exportar do `android/app/src/main/res/mipmap-*`.

**Feature graphic:** 1024×500 PNG (banner da listagem).

### 5.4 Data safety (declaração de dados)

Responda com base na [`PrivacyPage`](../src/pages/legal/PrivacyPage.tsx):

- Coleta: e-mail, nome, dados financeiros inseridos pelo usuário
- Pagamentos: processados pela Stripe (dados de cartão **não** ficam no app)
- Criptografia em trânsito: sim (HTTPS)
- Exclusão de conta: sim (fluxo LGPD no app)
- Dados compartilhados: Stripe (pagamento), Supabase (hospedagem), Google (login opcional)

Revise com advogado antes de publicar — os textos legais têm disclaimer de não revisados.

### 5.5 Testes antes de produção

1. **Internal testing** — adicione e-mails de teste → instale via link da Play Store
2. Valide: OTP, Google login (navegador do sistema), reset de senha, assinatura Pro
3. **Closed testing** — grupo maior (opcional)
4. **Production** — rollout gradual (ex.: 20% → 100%)

### 5.6 Atualizações futuras

```bash
# 1. Bump versionCode + versionName em android/app/build.gradle
# 2. npm run cap:sync
# 3. Generate Signed Bundle no Android Studio
# 4. Upload na Play Console → nova release
```

---

## 6. Observabilidade (recomendado)

[`ErrorBoundary.tsx`](../src/app/ErrorBoundary.tsx) tem TODO para Sentry. Antes do lançamento:

1. Crie projeto em [sentry.io](https://sentry.io)
2. `VITE_SENTRY_DSN` na Vercel **e** no build mobile (`cap:sync`)
3. Integre `@sentry/react` no boundary *(implementação pendente no código)*

Monitore também: Supabase → Logs, Stripe → Webhooks (falhas), Vercel → Analytics.

---

## 7. Rollback

| Camada | Como reverter |
| ------ | ------------- |
| **Vercel** | Deployments → promote deployment anterior |
| **Edge Functions** | `git checkout <commit>` → `supabase functions deploy <nome>` |
| **Migrations** | Preferir migrations **forward-only**; rollback manual só com script SQL dedicado |
| **Play Store** | Desativar release ou publicar versão anterior (mesmo `versionCode` não pode repetir — suba versão com código antigo) |

---

## 8. Ordem recomendada (resumo)

```
1. Merge main + feature (migrations 0007)
2. supabase db push
3. SMTP + template OTP + URLs auth
4. supabase secrets + deploy functions + webhook Stripe
5. Vercel env vars + deploy main
6. QA web + billing
7. cap:sync → AAB assinado → Play Console internal test
8. Revisão jurídica textos legais
9. Production web + rollout Play Store
```

Checklist interativo: [`docs/LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md).
