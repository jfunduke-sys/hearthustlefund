alter table public.school_requests
  add column if not exists fsa_intake_version text,
  add column if not exists fsa_intake_acknowledged_at timestamptz;

comment on column public.school_requests.fsa_intake_version is
  'Version id of the Fundraising Services Agreement document acknowledged on intake; matches app FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION.';

comment on column public.school_requests.fsa_intake_acknowledged_at is
  'When the submitter acknowledged the Fundraising Services Agreement (main program contract) on intake (UTC, audit).';
