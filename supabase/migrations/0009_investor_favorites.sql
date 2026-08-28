-- Favoritos do Investidor (sincronizados por conta — celular, PC, etc.)
create table if not exists public.investor_favorites (
  user_id    uuid references auth.users(id) on delete cascade primary key,
  tickers    jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table public.investor_favorites enable row level security;

drop policy if exists "own_data" on public.investor_favorites;
create policy "own_data" on public.investor_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_investor_favorites_user on public.investor_favorites(user_id);
