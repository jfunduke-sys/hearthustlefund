-- Run in Supabase SQL editor if `school_requests` already exists without this column.
alter table public.school_requests
  add column if not exists sport_club_activity text not null default '';
