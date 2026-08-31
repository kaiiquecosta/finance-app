-- Billing multi-canal: Stripe (web) + Google Play (Android).
-- Escrita continua exclusiva do servidor (Edge Functions + webhooks).

alter table public.plans add column if not exists billing_provider text;
alter table public.plans add column if not exists google_product_id text;
alter table public.plans add column if not exists google_base_plan_id text;
alter table public.plans add column if not exists google_purchase_token text;

comment on column public.plans.billing_provider is 'stripe | google_play — quem cobra a assinatura ativa';
comment on column public.plans.google_purchase_token is 'Token Play Billing para revalidação server-side';
