alter table public.fundraisers
  add column if not exists admin_compliance_notes text;

alter table public.fundraisers
  add column if not exists closed_at timestamptz;
