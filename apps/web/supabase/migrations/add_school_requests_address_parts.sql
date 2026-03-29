-- Run in Supabase SQL editor for existing projects.
alter table public.school_requests
  add column if not exists school_street text not null default '';

alter table public.school_requests
  add column if not exists school_city text not null default '';

alter table public.school_requests
  add column if not exists school_state text not null default '';

alter table public.school_requests
  add column if not exists school_zip text not null default '';
