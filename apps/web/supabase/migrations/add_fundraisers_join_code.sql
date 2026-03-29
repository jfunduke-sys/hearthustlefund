-- Team join codes for athlete signup (coach dashboard / join links).
-- Run in Supabase SQL Editor if your project predates this column.

alter table public.fundraisers
  add column if not exists join_code text;

create unique index if not exists fundraisers_join_code_uq
  on public.fundraisers (join_code)
  where join_code is not null;
