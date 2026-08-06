-- Cole no Supabase → SQL Editor → Run
-- 1) Se a aba Comunidade pedir migration, rode antes: migrations/0004_community.sql
-- 2) Este script torna admin quem usa o e-mail abaixo (mover colunas no roadmap).

-- Ver usuários (nome em profiles, e-mail em auth.users)
select u.id, p.name, u.email, coalesce(p.is_admin, false) as is_admin
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc;

-- Tornar admin (ajuste o e-mail se for outra conta)
update public.profiles p
set is_admin = true
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('contatokaiiquecosta@gmail.com');

-- Conferir
select u.id, p.name, u.email, p.is_admin
from public.profiles p
join auth.users u on u.id = p.id
where p.is_admin = true;
