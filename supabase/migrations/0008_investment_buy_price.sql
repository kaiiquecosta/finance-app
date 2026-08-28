-- Preço unitário na data da compra (ações, FIIs, cripto, etc.)
alter table public.investments add column if not exists buy_price numeric;
