-- ============================================================================
-- Backfill de `plans` para usuários existentes (idempotente).
--
-- O trigger `handle_new_user` (0001) só cria a linha em `plans` para NOVOS
-- cadastros (INSERT em auth.users). Contas criadas antes desta migration
-- (ex.: antes da tabela `plans` existir) não têm linha nenhuma — e sem linha,
-- isPro() no app trata como "não-pro", bloqueando recursos como Metas e
-- Investimentos mesmo para usuários que deveriam estar no período de teste.
--
-- Esta migration dá 30 dias de trial (a partir de HOJE) para qualquer usuário
-- que ainda não tenha registro em `plans`. Segura para rodar mais de uma vez
-- (só insere quem está faltando).
-- ============================================================================

insert into public.plans (user_id, plan, status, trial_ends_at)
select u.id, 'free', 'trialing', now() + interval '30 days'
from auth.users u
where not exists (
  select 1 from public.plans p where p.user_id = u.id
);
