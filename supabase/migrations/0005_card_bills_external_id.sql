-- Identificador externo (FITID do OFX) para deduplicar importações de fatura.
alter table public.card_bills
  add column if not exists external_id text;

create unique index if not exists card_bills_user_card_external_id_idx
  on public.card_bills (user_id, card_id, external_id)
  where external_id is not null;
