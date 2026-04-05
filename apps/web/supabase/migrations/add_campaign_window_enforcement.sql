-- Block logging "texted" contacts and recording donations outside fundraiser
-- start/end dates (calendar days in America/Chicago).

create or replace function public.enforce_contact_texted_in_campaign_window()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d_start date;
  d_end date;
  today_ct date;
begin
  if new.texted_at is null then
    return new;
  end if;
  if tg_op = 'update' and old.texted_at is not distinct from new.texted_at then
    return new;
  end if;

  select f.start_date, f.end_date
    into d_start, d_end
  from public.athletes a
  join public.fundraisers f on f.id = a.fundraiser_id
  where a.id = new.athlete_id;

  if d_start is null or d_end is null then
    return new;
  end if;

  today_ct := (timezone('America/Chicago', now()))::date;
  if today_ct < d_start then
    raise exception 'Fundraising texts can be sent starting on the campaign start date.';
  end if;
  if today_ct > d_end then
    raise exception 'Fundraising texts cannot be sent after the campaign end date.';
  end if;

  return new;
end;
$$;

drop trigger if exists tr_athlete_contacts_campaign_window on public.athlete_contacts;
create trigger tr_athlete_contacts_campaign_window
  before insert or update of texted_at on public.athlete_contacts
  for each row
  execute procedure public.enforce_contact_texted_in_campaign_window();

create or replace function public.enforce_donation_in_campaign_window()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d_start date;
  d_end date;
  today_ct date;
begin
  select f.start_date, f.end_date
    into d_start, d_end
  from public.fundraisers f
  where f.id = new.fundraiser_id;

  if d_start is null or d_end is null then
    return new;
  end if;

  today_ct := (timezone('America/Chicago', now()))::date;
  if today_ct < d_start or today_ct > d_end then
    raise exception 'Donations are only accepted between the campaign start and end dates (Central Time).';
  end if;

  return new;
end;
$$;

drop trigger if exists tr_donations_campaign_window on public.donations;
create trigger tr_donations_campaign_window
  before insert on public.donations
  for each row
  execute procedure public.enforce_donation_in_campaign_window();
