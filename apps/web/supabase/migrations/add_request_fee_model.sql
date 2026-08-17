-- Campaign fee structure chosen on the fundraiser request (locked into the
-- signed agreement and copied onto the fundraiser when the campaign starts).
alter table public.school_requests
  add column if not exists fee_model text not null default 'split_90_10';

alter table public.school_requests
  drop constraint if exists school_requests_fee_model_check;

alter table public.school_requests
  add constraint school_requests_fee_model_check
  check (fee_model in ('split_90_10', 'keep_100'));

alter table public.organization_agreements
  add column if not exists fee_model text not null default 'split_90_10';

alter table public.organization_agreements
  drop constraint if exists organization_agreements_fee_model_check;

alter table public.organization_agreements
  add constraint organization_agreements_fee_model_check
  check (fee_model in ('split_90_10', 'keep_100'));
