-- Dual fee model support: keep existing 90/10 as default; optional Keep 100%.
-- Safe for production: additive columns only; default preserves current behavior.

alter table public.fundraisers
  add column if not exists fee_model text not null default 'split_90_10';

comment on column public.fundraisers.fee_model is
  'Pricing model: split_90_10 (default, Fall) | keep_100 (Electronic Payment Fee + optional H&H Support).';

alter table public.fundraisers
  drop constraint if exists fundraisers_fee_model_check;

alter table public.fundraisers
  add constraint fundraisers_fee_model_check
  check (fee_model in ('split_90_10', 'keep_100'));

-- Donation breakdown (null / unused for legacy 90/10 rows).
alter table public.donations
  add column if not exists fee_model text,
  add column if not exists stated_donation_amount numeric(10, 2),
  add column if not exists electronic_payment_fee_amount numeric(10, 2),
  add column if not exists fee_payment_mode text,
  add column if not exists hh_support_amount numeric(10, 2),
  add column if not exists total_charged_amount numeric(10, 2),
  add column if not exists checkout_payment_method text;

comment on column public.donations.amount is
  'Amount credited to the organization (team progress / payout basis). For 90/10 equals total charged; for keep_100 equals org allocation.';
comment on column public.donations.stated_donation_amount is
  'Donor-selected gift amount before Electronic Payment Fee treatment.';
comment on column public.donations.electronic_payment_fee_amount is
  'Electronic Payment Fee (card 3.9%+$0.30 or ACH 1%).';
comment on column public.donations.fee_payment_mode is
  'donor_covered | deducted_from_donation (keep_100 only).';
comment on column public.donations.hh_support_amount is
  'Optional Heart & Hustle Support (0 if not opted in).';
comment on column public.donations.total_charged_amount is
  'Total amount charged to the donor via Stripe.';
comment on column public.donations.checkout_payment_method is
  'card | us_bank_account (keep_100); null for legacy 90/10.';
