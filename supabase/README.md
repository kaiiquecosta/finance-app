# Supabase — schema, migrations e funções

## Estrutura

```
supabase/
├─ migrations/
│  ├─ 0001_schema.sql          # schema base (idempotente): tabelas, RLS, plans, trigger
│  └─ 0002_plans_backfill.sql  # dá 30 dias de trial a usuários que já existiam
│                               # antes da tabela `plans`/trigger existirem
└─ functions/                   # Edge Functions (Stripe, exclusão de conta)
config.toml                     # template Magic Link (OTP) — ver docs/AUTH.md
email-templates/magic-link.html # corpo do e-mail com {{ .Token }}
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
5. Admin do roadmap (mover colunas): `scripts/comunidade-tornar-admin.sql` → **Run**
   (ou use só o `update` com join em `auth.users` — **não** use `select name from auth.users`, essa coluna não existe)

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
