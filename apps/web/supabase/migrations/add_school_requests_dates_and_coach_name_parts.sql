-- Proposed fundraiser window + coach first/last name

alter table public.school_requests
  add column if not exists admin_first_name text,
  add column if not exists admin_last_name text,
  add column if not exists fundraiser_start_date date,
  add column if not exists fundraiser_end_date date;

-- Backfill name parts from legacy admin_name (first word / remainder)
update public.school_requests
set
  admin_first_name = nullif(
    trim(split_part(coalesce(trim(admin_name), ''), ' ', 1)),
    ''
  ),
  admin_last_name = nullif(
    trim(
      substring(
        coalesce(trim(admin_name), '')
        from length(split_part(coalesce(trim(admin_name), ''), ' ', 1)) + 2
      )
    ),
    ''
  )
where admin_first_name is null;

update public.school_requests
set admin_first_name = coalesce(admin_first_name, trim(admin_name), '')
where admin_first_name is null or trim(admin_first_name) = '';

update public.school_requests
set admin_last_name = coalesce(admin_last_name, '')
where admin_last_name is null;

alter table public.school_requests alter column admin_first_name set not null;
alter table public.school_requests alter column admin_last_name set not null;
