-- ============================================================================
-- Finance App v2 — Schema base (idempotente)
-- Seguro para rodar em projeto novo OU no projeto atual que já tem as tabelas.
-- Aplicar via Supabase SQL Editor ou `supabase db push`.
--
-- Notas de design:
--  • Dinheiro é `numeric` (decimal exato no Postgres). O frontend converte para
--    centavos inteiros (`Cents`) na borda — ver src/domain/money.
--  • IDs `bigint` gerados no cliente foram MANTIDOS por compatibilidade com os
--    dados já existentes (dívida técnica documentada no ROADMAP).
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ── PROFILES ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  phone       text,
  avatar_url  text,
  color       text default '#22c55e',
  emoji       text default '😊',
  created_at  timestamptz default now()
);

-- ── TRANSACTIONS ─────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id            bigint primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  cat           text default 'outros',
  amt           numeric not null,
  date          date not null,
  account_id    bigint,
  investment_id bigint,
  bill_id       bigint,
  income_key    text,
  is_new        boolean default false,
  created_at    timestamptz default now()
);

-- ── CARDS ─────────────────────────────────────────────────────────────────
create table if not exists public.cards (
  id          bigint primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  color       text default '#8b5cf6',
  card_limit  numeric not null default 0,
  close_day   int not null default 10,
  due_day     int not null default 15,
  card_type   text default 'Crédito',
  created_at  timestamptz default now()
);

-- ── CARD BILLS ──────────────────────────────────────────────────────────────
create table if not exists public.card_bills (
  id           bigint primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  card_id      bigint references public.cards(id) on delete cascade not null,
  description  text not null,
  amt          numeric not null,
  date         date not null,
  is_past_paid boolean default false,
  recurring    boolean default false,
  created_at   timestamptz default now()
);

-- ── INSTALLMENTS ─────────────────────────────────────────────────────────────
create table if not exists public.installments (
  id       bigint primary key,
  user_id  uuid references auth.users(id) on delete cascade not null,
  name     text not null,
  total    numeric not null,
  parcels  int not null,
  paid     int default 0,
  icon     text default '💳',
  color    text default '#3b82f6',
  card_id  bigint,
  created_at timestamptz default now()
);

-- ── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id       bigint primary key,
  user_id  uuid references auth.users(id) on delete cascade not null,
  name     text not null,
  amt      numeric not null,
  day      int not null default 1,
  icon     text default '📱',
  color    text default '#8b5cf6',
  card_id  bigint,
  created_at timestamptz default now()
);

-- ── GOALS ─────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id       bigint primary key,
  user_id  uuid references auth.users(id) on delete cascade not null,
  name     text not null,
  target   numeric not null,
  saved    numeric default 0,
  icon     text default '🎯',
  color    text default '#22c55e',
  deadline text,
  created_at timestamptz default now()
);

-- ── BANK ACCOUNTS ────────────────────────────────────────────────────────────
create table if not exists public.bank_accounts (
  id              bigint primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  name            text not null,
  color           text default '#64748b',
  account_type    text default 'corrente',
  initial_balance numeric default 0,
  created_at      timestamptz default now()
);

-- ── INCOMES ─────────────────────────────────────────────────────────────────
create table if not exists public.incomes (
  id         bigint primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  amt        numeric not null,
  freq       text default 'mensal',
  icon       text default '💰',
  color      text default '#22c55e',
  account_id bigint,
  days       jsonb default '[]',
  received   jsonb default '[]',          -- corrige bug: "recebido" agora persiste
  auto       boolean default true,
  created_at timestamptz default now()
);

-- ── FIXED BILLS ──────────────────────────────────────────────────────────────
create table if not exists public.fixed_bills (
  id          bigint primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  amt         numeric not null,
  due_day     int not null default 10,
  icon        text default '📄',
  color       text default '#3b82f6',
  category    text default 'Outros',
  paid        boolean default false,
  paid_at     date,
  paid_amount numeric,                     -- corrige drift (era lido mas não gravado)
  created_at  timestamptz default now()
);

-- ── INVESTMENTS ──────────────────────────────────────────────────────────────
create table if not exists public.investments (
  id         bigint primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  bank       text,
  amount     numeric not null,
  date       date not null,
  inv_type   text not null default 'cdb',
  pct        numeric default 0,
  spread     numeric default 0,
  yield_pct  numeric default 0,
  ticker     text,
  account_id bigint,
  created_at timestamptz default now()
);

-- ── PLANS (assinatura Pro / trial) — a tabela que faltava no schema ──────────
-- Escrita SOMENTE pelo servidor (webhook Stripe via service_role, que ignora
-- RLS). O usuário só LÊ o próprio plano → ninguém consegue se tornar Pro no客.
create table if not exists public.plans (
  user_id            uuid references auth.users(id) on delete cascade primary key,
  plan               text not null default 'free',     -- 'free' | 'pro'
  status             text not null default 'active',    -- active|trialing|canceled|past_due|incomplete
  trial_ends_at      timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_sub_id      text,
  updated_at         timestamptz default now()
);

-- Colunas que podem faltar em bases antigas (idempotência):
alter table public.fixed_bills add column if not exists paid_amount numeric;
alter table public.incomes     add column if not exists received jsonb default '[]';
alter table public.incomes     add column if not exists auto boolean default true;

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.transactions  enable row level security;
alter table public.cards         enable row level security;
alter table public.card_bills    enable row level security;
alter table public.installments  enable row level security;
alter table public.subscriptions enable row level security;
alter table public.goals         enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.incomes       enable row level security;
alter table public.fixed_bills   enable row level security;
alter table public.investments   enable row level security;
alter table public.plans         enable row level security;

-- Policies "own_data": USING (leitura) + WITH CHECK (escrita) explícitos.
do $$
declare
  t text;
  owned text[] := array[
    'transactions','cards','card_bills','installments','subscriptions',
    'goals','bank_accounts','incomes','fixed_bills','investments'
  ];
begin
  -- profiles: a coluna dona é `id`
  execute 'drop policy if exists "own_data" on public.profiles';
  execute 'create policy "own_data" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id)';

  foreach t in array owned loop
    execute format('drop policy if exists "own_data" on public.%I', t);
    execute format(
      'create policy "own_data" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;

-- plans: usuário só LÊ o próprio; escrita fica a cargo do servidor (service_role).
drop policy if exists "plans_select_own" on public.plans;
create policy "plans_select_own" on public.plans for select using (auth.uid() = user_id);

-- ── ÍNDICES (consultas filtram por user_id) ──────────────────────────────────
create index if not exists idx_transactions_user  on public.transactions(user_id);
create index if not exists idx_cards_user          on public.cards(user_id);
create index if not exists idx_card_bills_user     on public.card_bills(user_id);
create index if not exists idx_card_bills_card      on public.card_bills(card_id);
create index if not exists idx_installments_user   on public.installments(user_id);
create index if not exists idx_subscriptions_user  on public.subscriptions(user_id);
create index if not exists idx_goals_user          on public.goals(user_id);
create index if not exists idx_bank_accounts_user  on public.bank_accounts(user_id);
create index if not exists idx_incomes_user        on public.incomes(user_id);
create index if not exists idx_fixed_bills_user    on public.fixed_bills(user_id);
create index if not exists idx_investments_user    on public.investments(user_id);

-- ── TRIGGER: cria profile + plano (trial 30 dias) ao cadastrar ───────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.plans (user_id, plan, status, trial_ends_at)
  values (new.id, 'free', 'trialing', now() + interval '30 days')
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
