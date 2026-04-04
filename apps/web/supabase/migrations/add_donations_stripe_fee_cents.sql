-- Stripe processing fee per donation (cents), from balance transaction at capture time.

alter table public.donations
  add column if not exists stripe_fee_cents integer;

comment on column public.donations.stripe_fee_cents is
  'Stripe processing fee in cents (from charge balance_transaction.fee). Nullable for legacy rows.';
