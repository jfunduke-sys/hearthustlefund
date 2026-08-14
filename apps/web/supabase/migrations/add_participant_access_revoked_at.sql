-- Track when participant app auth was revoked (cron after end+grace, or closeout).
alter table public.fundraisers
  add column if not exists participant_access_revoked_at timestamptz;
