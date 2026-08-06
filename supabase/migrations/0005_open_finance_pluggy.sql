-- Open Finance / Pluggy — conexões, contas externas e deduplicação de importação
-- Ver docs/PLUGGY.md

create table if not exists public.financial_connections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  provider        text not null default 'pluggy',
  mode            text not null default 'personal',
  pluggy_item_id  uuid not null,
  connector_id    int,
  connector_name  text,
  status          text not null default 'UPDATED',
  last_synced_at  timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (user_id, pluggy_item_id)
);

create table if not exists public.financial_external_accounts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  connection_id       uuid references public.financial_connections(id) on delete cascade not null,
  pluggy_account_id   uuid not null,
  bank_account_id     bigint references public.bank_accounts(id) on delete set null,
  account_kind        text not null default 'BANK',
  account_subtype     text,
  display_name        text not null,
  balance             numeric,
  credit_limit        numeric,
  currency            text default 'BRL',
  last_synced_at      timestamptz,
  raw                 jsonb,
  created_at          timestamptz default now(),
  unique (user_id, pluggy_account_id)
);

create table if not exists public.transaction_imports (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  provider        text not null default 'pluggy',
  external_id     text not null,
  transaction_id  bigint references public.transactions(id) on delete set null,
  external_account_id uuid references public.financial_external_accounts(id) on delete set null,
  imported_at     timestamptz default now(),
  unique (user_id, provider, external_id)
);

alter table public.financial_connections enable row level security;
alter table public.financial_external_accounts enable row level security;
alter table public.transaction_imports enable row level security;

drop policy if exists "own_data" on public.financial_connections;
create policy "own_data" on public.financial_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_data" on public.financial_external_accounts;
create policy "own_data" on public.financial_external_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_data" on public.transaction_imports;
create policy "own_data" on public.transaction_imports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_financial_connections_user on public.financial_connections(user_id);
create index if not exists idx_financial_external_accounts_user on public.financial_external_accounts(user_id);
create index if not exists idx_financial_external_accounts_connection on public.financial_external_accounts(connection_id);
create index if not exists idx_transaction_imports_user on public.transaction_imports(user_id);
create index if not exists idx_transaction_imports_tx on public.transaction_imports(transaction_id);
