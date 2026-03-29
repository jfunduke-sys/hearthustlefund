-- Run once on existing DBs that created tables from an older schema.sql (before phone_normalized).
-- New projects can rely on the main schema.sql only.

-- 1) athlete_contacts: add phone_normalized, backfill, dedupe, enforce uniqueness
alter table public.athlete_contacts
  add column if not exists phone_normalized text;

update public.athlete_contacts
set phone_normalized = regexp_replace(coalesce(phone_number, ''), '\D', '', 'g')
where phone_normalized is null or phone_normalized = '';

delete from public.athlete_contacts a
using public.athlete_contacts b
where a.id > b.id
  and a.athlete_id = b.athlete_id
  and a.phone_normalized = b.phone_normalized
  and length(a.phone_normalized) >= 10;

delete from public.athlete_contacts where length(phone_normalized) < 10;

alter table public.athlete_contacts alter column phone_normalized set not null;

drop trigger if exists tr_athlete_contacts_normalized on public.athlete_contacts;

create or replace function public.athlete_contacts_set_normalized()
returns trigger
language plpgsql
as $$
begin
  new.phone_normalized := regexp_replace(coalesce(new.phone_number, ''), '\D', '', 'g');
  if length(new.phone_normalized) < 10 then
    raise exception 'phone_number must contain at least 10 digits';
  end if;
  return new;
end;
$$;

create trigger tr_athlete_contacts_normalized
  before insert or update of phone_number on public.athlete_contacts
  for each row
  execute procedure public.athlete_contacts_set_normalized();

create unique index if not exists athlete_contacts_athlete_phone_norm_uq
  on public.athlete_contacts (athlete_id, phone_normalized);

-- 2) athletes: one row per user per fundraiser (coach participant)
delete from public.athletes a
using public.athletes b
where a.id > b.id
  and a.fundraiser_id = b.fundraiser_id
  and a.user_id = b.user_id
  and a.user_id is not null;

create unique index if not exists athletes_fundraiser_user_uq
  on public.athletes (fundraiser_id, user_id);
