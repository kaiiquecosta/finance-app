# Supabase — schema, migrations e funções

## Estrutura

```
supabase/
├─ migrations/
│  ├─ 0001_schema.sql                    # schema base (idempotente): tabelas, RLS, plans, trigger
│  ├─ 0002_plans_backfill.sql            # trial 30 dias para usuários pré-existentes
│  ├─ 0004_community.sql                # roadmap da Comunidade (sugestões, likes, comentários)
│  ├─ 0005_open_finance_pluggy.sql      # Open Finance / Pluggy (branch `main`)
│  ├─ 0006_community_realtime.sql       # realtime na Comunidade (branch `main`)
│  └─ 0007_card_bills_external_id.sql   # FITID do OFX — dedup importação (após merge da feature)
└─ functions/                            # Edge Functions (Stripe, exclusão de conta)
```

> **Conflito entre branches:** `feat/identidade-visual-legado` tinha
> `0005_card_bills_external_id.sql`, mas `main` já usa `0005` para Pluggy. Após o merge,
> renomeie a migration OFX para **`0007_card_bills_external_id.sql`** antes do `db push`.
> Ver [`docs/DEPLOY.md`](../docs/DEPLOY.md#0-pré-requisito-unificar-branches).

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
8. Admin do roadmap (mover colunas): `scripts/comunidade-tornar-admin.sql` → **Run**
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
