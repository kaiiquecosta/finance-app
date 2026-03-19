-- ============================================================
-- Finance App — Schema PostgreSQL para Supabase
-- Execute no SQL Editor do Supabase (dashboard.supabase.com)
-- ============================================================

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────────────────────
-- Estende o auth.users do Supabase com dados do perfil
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  phone       text,
  avatar_url  text,
  color       text default '#22c55e',
  emoji       text default '😊',
  created_at  timestamptz default now()
);

-- ── TRANSACTIONS ──────────────────────────────────────────────────────────
create table public.transactions (
  id          bigint primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  cat         text default 'outros',
  amt         numeric not null,
  date        date not null,
  account_id  bigint,
  investment_id bigint,
  bill_id     bigint,
  income_key  text,
  is_new      boolean default false,
  created_at  timestamptz default now()
);

-- ── CARDS (cartões de crédito) ────────────────────────────────────────────
create table public.cards (
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

-- ── CARD BILLS (lançamentos na fatura) ────────────────────────────────────
create table public.card_bills (
  id          bigint primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  card_id     bigint references public.cards(id) on delete cascade not null,
  description text not null,
  amt         numeric not null,
  date        date not null,
  is_past_paid boolean default false,
  recurring   boolean default false,
  created_at  timestamptz default now()
);

-- ── INSTALLMENTS (parcelamentos manuais) ──────────────────────────────────
create table public.installments (
  id          bigint primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  total       numeric not null,
  parcels     int not null,
  paid        int default 0,
  icon        text default '💳',
  color       text default '#3b82f6',
  card_id     bigint,
  created_at  timestamptz default now()
);

-- ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
create table public.subscriptions (
  id          bigint primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  amt         numeric not null,
  day         int not null default 1,
  icon        text default '📱',
  color       text default '#8b5cf6',
  card_id     bigint,
  created_at  timestamptz default now()
);

-- ── GOALS (metas) ─────────────────────────────────────────────────────────
create table public.goals (
  id          bigint primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  target      numeric not null,
  saved       numeric default 0,
  icon        text default '🎯',
  color       text default '#22c55e',
  deadline    text,
  created_at  timestamptz default now()
);

-- ── BANK ACCOUNTS ─────────────────────────────────────────────────────────
create table public.bank_accounts (
  id              bigint primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  name            text not null,
  color           text default '#64748b',
  account_type    text default 'corrente',
  initial_balance numeric default 0,
  created_at      timestamptz default now()
);

-- ── INCOMES (rendas recorrentes) ──────────────────────────────────────────
create table public.incomes (
  id          bigint primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  amt         numeric not null,
  freq        text default 'mensal',
  icon        text default '💰',
  color       text default '#22c55e',
  account_id  bigint,
  days        jsonb default '[]',
  created_at  timestamptz default now()
);

-- ── FIXED BILLS (contas fixas) ────────────────────────────────────────────
create table public.fixed_bills (
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
  created_at  timestamptz default now()
);

-- ── INVESTMENTS ───────────────────────────────────────────────────────────
create table public.investments (
  id          bigint primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  bank        text,
  amount      numeric not null,
  date        date not null,
  inv_type    text not null default 'cdb',
  pct         numeric default 0,
  spread      numeric default 0,
  yield_pct   numeric default 0,
  ticker      text,
  account_id  bigint,
  created_at  timestamptz default now()
);

-- ── ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────────
-- Garante que cada usuário só vê seus próprios dados

alter table public.profiles      enable row level security;
alter table public.transactions   enable row level security;
alter table public.cards          enable row level security;
alter table public.card_bills     enable row level security;
alter table public.installments   enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.goals          enable row level security;
alter table public.bank_accounts  enable row level security;
alter table public.incomes        enable row level security;
alter table public.fixed_bills    enable row level security;
alter table public.investments    enable row level security;

-- Policies: usuário só acessa seus próprios dados
create policy "own_data" on public.profiles      for all using (auth.uid() = id);
create policy "own_data" on public.transactions  for all using (auth.uid() = user_id);
create policy "own_data" on public.cards         for all using (auth.uid() = user_id);
create policy "own_data" on public.card_bills    for all using (auth.uid() = user_id);
create policy "own_data" on public.installments  for all using (auth.uid() = user_id);
create policy "own_data" on public.subscriptions for all using (auth.uid() = user_id);
create policy "own_data" on public.goals         for all using (auth.uid() = user_id);
create policy "own_data" on public.bank_accounts for all using (auth.uid() = user_id);
create policy "own_data" on public.incomes       for all using (auth.uid() = user_id);
create policy "own_data" on public.fixed_bills   for all using (auth.uid() = user_id);
create policy "own_data" on public.investments   for all using (auth.uid() = user_id);

-- ── TRIGGER: cria perfil automaticamente após signup ─────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
