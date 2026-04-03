alter table public.fundraisers
  add column if not exists expected_participants int;

comment on column public.fundraisers.expected_participants is
  'Coach-entered expected participant count at campaign setup (from intake or adjusted).';
