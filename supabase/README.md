# Supabase — schema, migrations e funções

## Estrutura

```
supabase/
├─ migrations/
│  ├─ 0001_schema.sql                    # schema base (idempotente): tabelas, RLS, plans, trigger
│  ├─ 0002_plans_backfill.sql            # trial 30 dias para usuários pré-existentes
│  ├─ 0004_community.sql                # roadmap da Comunidade (sugestões, likes, comentários)
│  ├─ 0005_open_finance_pluggy.sql       # Open Finance / Pluggy
│  ├─ 0006_community_realtime.sql        # notificações realtime na Comunidade
│  └─ 0009_investor_favorites.sql
│  └─ 0010_billing_google_play.sql      # Stripe + Google Play em plans
├─ functions/                            # Edge Functions (Stripe, exclusão de conta)
config.toml                              # template Magic Link (OTP) — ver docs/AUTH.md
email-templates/magic-link.html          # corpo do e-mail com {{ .Token }}
```

## E-mail de login (código de 6 dígitos)

O app usa `signInWithOtp` + digitação do código. No Supabase, isso depende do template
**Magic Link** incluir `{{ .Token }}`. Passo a passo: [`docs/AUTH.md`](../docs/AUTH.md).

Atalho: `npm run auth:push-email-template` (requer `SUPABASE_ACCESS_TOKEN`).

## Aplicar o schema

O `0001_schema.sql` é **idempotente** (`create table if not exists`, `add column if not
exists`, `drop policy if exists` + recreate) — seguro tanto num projeto novo quanto no projeto
atual que já tem as tabelas com dados.

### Opção A — SQL Editor (mais simples)

1. Abra o projeto no [dashboard.supabase.com](https://dashboard.supabase.com)
2. **SQL Editor** → cole o conteúdo de `migrations/0001_schema.sql` → **Run**
3. Rode também `migrations/0002_plans_backfill.sql` → **Run** (garante que contas
   já existentes ganhem os 30 dias de trial, e não fiquem bloqueadas de recursos
   Pro por falta de registro em `plans`)
4. Para a aba **Comunidade**: `migrations/0004_community.sql` → **Run**
5. Open Finance (se usar): `0005_open_finance_pluggy.sql` → **Run**
6. Realtime Comunidade: `0006_community_realtime.sql` → **Run**
7. Importação OFX (cartões): `0007_card_bills_external_id.sql` → **Run**
8. Favoritos investidor: `0009_investor_favorites.sql` → **Run**
9. Billing Google Play: `0010_billing_google_play.sql` → **Run**
   (ou use só o `update` com join em `auth.users` — **não** use `select name from auth.users`, essa coluna não existe)

Guia completo de deploy: [`docs/DEPLOY.md`](../docs/DEPLOY.md).

### Opção B — Supabase CLI

```bash
npx supabase link --project-ref <SEU_PROJECT_REF>
npx supabase db push
```

## O que este schema garante

- **RLS em todas as tabelas** com `USING` + `WITH CHECK` explícitos → cada usuário só lê e
  escreve os próprios dados (isolamento por `auth.uid()`).
- **Tabela `plans`** (assinatura/trial): o usuário só **lê** o próprio plano. A escrita é
  **exclusiva do servidor** (webhook do Stripe via `service_role`, que ignora RLS) →
  ninguém consegue se tornar Pro pelo cliente.
- **Trial de 30 dias** criado automaticamente no cadastro (trigger `handle_new_user`).
- Correções de drift: `fixed_bills.paid_amount`, `incomes.received`, `incomes.auto`.

## Segredos (Fase 4 — nunca no frontend)

As Edge Functions de pagamento usarão segredos configurados no servidor:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```
