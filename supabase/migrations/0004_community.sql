-- Comunidade: sugestões compartilhadas, likes e comentários (priorização por interesse).
-- Marque admins em public.profiles (is_admin = true) para mover cards entre colunas.

alter table public.profiles add column if not exists is_admin boolean not null default false;

create table if not exists public.community_items (
  id          bigint primary key,
  author_id   uuid references auth.users(id) on delete set null,
  title       text not null,
  body        text not null default '',
  status      text not null default 'backlog'
    check (status in ('backlog', 'planned', 'in_progress', 'done')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.community_likes (
  item_id     bigint references public.community_items(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  created_at  timestamptz not null default now(),
  primary key (item_id, user_id)
);

create table if not exists public.community_comments (
  id          bigint primary key,
  item_id     bigint references public.community_items(id) on delete cascade not null,
  author_id   uuid references auth.users(id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_community_items_status on public.community_items(status);
create index if not exists idx_community_likes_item on public.community_likes(item_id);
create index if not exists idx_community_comments_item on public.community_comments(item_id);

-- Impede usuários comuns de mudar o status (só admin ou trigger mantém).
create or replace function public.is_community_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.community_items_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and not public.is_community_admin() then
    new.status := old.status;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists community_items_before_update on public.community_items;
create trigger community_items_before_update
  before update on public.community_items
  for each row execute procedure public.community_items_before_update();

alter table public.community_items enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_comments enable row level security;

drop policy if exists "community_items_select" on public.community_items;
create policy "community_items_select" on public.community_items
  for select to authenticated using (true);

drop policy if exists "community_items_insert" on public.community_items;
create policy "community_items_insert" on public.community_items
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "community_items_update" on public.community_items;
create policy "community_items_update" on public.community_items
  for update to authenticated
  using (author_id = auth.uid() or public.is_community_admin())
  with check (author_id = auth.uid() or public.is_community_admin());

drop policy if exists "community_items_delete" on public.community_items;
create policy "community_items_delete" on public.community_items
  for delete to authenticated
  using (author_id = auth.uid() or public.is_community_admin());

drop policy if exists "community_likes_select" on public.community_likes;
create policy "community_likes_select" on public.community_likes
  for select to authenticated using (true);

drop policy if exists "community_likes_insert" on public.community_likes;
create policy "community_likes_insert" on public.community_likes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "community_likes_delete" on public.community_likes;
create policy "community_likes_delete" on public.community_likes
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "community_comments_select" on public.community_comments;
create policy "community_comments_select" on public.community_comments
  for select to authenticated using (true);

drop policy if exists "community_comments_insert" on public.community_comments;
create policy "community_comments_insert" on public.community_comments
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "community_comments_delete" on public.community_comments;
create policy "community_comments_delete" on public.community_comments
  for delete to authenticated
  using (author_id = auth.uid() or public.is_community_admin());
