-- Realtime: autor recebe atualização de status sem recarregar (web/PWA).
do $migration$
begin
  alter publication supabase_realtime add table public.community_items;
exception
  when duplicate_object then
    null;
end;
$migration$;
