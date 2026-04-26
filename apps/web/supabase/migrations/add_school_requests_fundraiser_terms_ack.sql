alter table public.school_requests
  add column if not exists fundraiser_terms_version text,
  add column if not exists fundraiser_terms_acknowledged_at timestamptz;

comment on column public.school_requests.fundraiser_terms_version is
  'Version id of the standard fundraiser terms agreed to on intake (e.g. 1). Bump in app when terms copy changes.';

comment on column public.school_requests.fundraiser_terms_acknowledged_at is
  'When the submitter agreed to the standard fundraiser terms (UTC, audit).';
