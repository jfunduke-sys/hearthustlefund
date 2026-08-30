-- New campaign requests default to 100% back (keep_100).
-- Legacy split_90_10 rows and check constraints are unchanged.

alter table public.school_requests
  alter column fee_model set default 'keep_100';

alter table public.organization_agreements
  alter column fee_model set default 'keep_100';

alter table public.fundraisers
  alter column fee_model set default 'keep_100';
