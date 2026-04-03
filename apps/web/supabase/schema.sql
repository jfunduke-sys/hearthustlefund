-- Heart & Hustle Fundraising — run in Supabase SQL editor (order preserved)

create extension if not exists "pgcrypto";

-- 1. school_requests (no FKs to other app tables)
create table if not exists public.school_requests (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  school_district text not null,
  school_street text not null default '',
  school_city text not null default '',
  school_state text not null default '',
  school_zip text not null default '',
  school_address text not null,
  sport_club_activity text not null default '',
  admin_name text not null,
  admin_first_name text not null default '',
  admin_last_name text not null default '',
  admin_email text not null,
  admin_phone text not null,
  estimated_athletes int,
  fundraiser_start_date date,
  fundraiser_end_date date,
  paperwork_sent boolean default false,
  paperwork_returned boolean default false,
  status text default 'pending',
  notes text,
  created_at timestamptz default now()
);

-- 2. fundraiser_codes (assigned_to_email = coach who administers the fundraiser; required)
create table if not exists public.fundraiser_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_by uuid references auth.users (id),
  assigned_to_email text not null,
  school_request_id uuid references public.school_requests (id),
  used boolean default false,
  used_at timestamptz,
  used_by uuid references auth.users (id),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 3. fundraisers
create table if not exists public.fundraisers (
  id uuid primary key default gen_random_uuid(),
  code_used text references public.fundraiser_codes (code),
  coach_id uuid references auth.users (id),
  school_name text not null,
  team_name text not null,
  total_goal numeric(10, 2) not null,
  goal_per_athlete numeric(10, 2),
  expected_participants int,
  school_logo_url text,
  team_logo_url text,
  start_date date not null,
  end_date date not null,
  status text default 'active',
  unique_slug text unique not null,
  join_code text,
  admin_compliance_notes text,
  closed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.fundraisers add column if not exists join_code text;
create unique index if not exists fundraisers_join_code_uq
  on public.fundraisers (join_code)
  where join_code is not null;

-- 4. athletes
create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  fundraiser_id uuid references public.fundraisers (id) on delete cascade,
  user_id uuid references auth.users (id),
  full_name text not null,
  team_name text not null,
  jersey_number text,
  personal_goal numeric(10, 2),
  show_on_team_roster boolean not null default true,
  unique_link_token text unique not null default gen_random_uuid()::text,
  created_at timestamptz default now()
);

-- 5. donations (donor_phone optional — match to athlete_contacts in webhook)
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  fundraiser_id uuid references public.fundraisers (id) on delete cascade,
  athlete_id uuid references public.athletes (id) on delete cascade,
  stripe_payment_id text unique not null,
  amount numeric(10, 2) not null,
  donor_name text,
  donor_email text,
  donor_phone text,
  anonymous boolean default false,
  created_at timestamptz default now()
);

-- 6. athlete_contacts — only selected contacts are stored server-side (dedupe per athlete via phone_normalized)
create table if not exists public.athlete_contacts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes (id) on delete cascade,
  contact_name text,
  phone_number text not null,
  phone_normalized text not null,
  texted_at timestamptz,
  donated boolean default false,
  created_at timestamptz default now(),
  unique (athlete_id, phone_normalized)
);

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

drop trigger if exists tr_athlete_contacts_normalized on public.athlete_contacts;
create trigger tr_athlete_contacts_normalized
  before insert or update of phone_number on public.athlete_contacts
  for each row
  execute procedure public.athlete_contacts_set_normalized();

create index if not exists idx_fundraisers_coach on public.fundraisers (coach_id);
create index if not exists idx_fundraisers_slug on public.fundraisers (unique_slug);
create index if not exists idx_athletes_user on public.athletes (user_id);
create index if not exists idx_athletes_fundraiser on public.athletes (fundraiser_id);
create index if not exists idx_athletes_token on public.athletes (unique_link_token);
create index if not exists idx_donations_fundraiser on public.donations (fundraiser_id);
create index if not exists idx_donations_athlete on public.donations (athlete_id);
create index if not exists idx_contacts_athlete on public.athlete_contacts (athlete_id);

-- one athlete profile per user per fundraiser (coach can participate alongside team)
create unique index if not exists athletes_fundraiser_user_uq
  on public.athletes (fundraiser_id, user_id);

-- Row Level Security
alter table public.school_requests enable row level security;
alter table public.fundraiser_codes enable row level security;
alter table public.fundraisers enable row level security;
alter table public.athletes enable row level security;
alter table public.donations enable row level security;
alter table public.athlete_contacts enable row level security;

-- school_requests: public intake insert only
create policy "Anyone can submit school request"
  on public.school_requests for insert
  to anon, authenticated
  with check (true);

-- fundraiser_codes: coach can read rows assigned to their email
create policy "Coach can read assigned codes"
  on public.fundraiser_codes for select
  to authenticated
  using (
    assigned_to_email is not null
    and lower(trim(assigned_to_email)) = lower(trim(auth.jwt() ->> 'email'))
  );

create policy "Coach can update assigned unused codes"
  on public.fundraiser_codes for update
  to authenticated
  using (
    used = false
    and assigned_to_email is not null
    and lower(trim(assigned_to_email)) = lower(trim(auth.jwt() ->> 'email'))
  )
  with check (
    assigned_to_email is not null
    and lower(trim(assigned_to_email)) = lower(trim(auth.jwt() ->> 'email'))
  );

-- fundraisers: coach owns rows
create policy "Coach can read own fundraisers"
  on public.fundraisers for select
  to authenticated
  using (coach_id = auth.uid());

create policy "Coach can insert own fundraisers"
  on public.fundraisers for insert
  to authenticated
  with check (coach_id = auth.uid());

create policy "Coach can update own fundraisers"
  on public.fundraisers for update
  to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- fundraisers: athletes can read their campaign (use SECURITY DEFINER helper so
-- evaluating fundraisers RLS does not re-enter athletes RLS → no recursion)
create or replace function public.user_has_athlete_on_fundraiser(p_fundraiser_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.athletes a
    where a.fundraiser_id = p_fundraiser_id
      and a.user_id = auth.uid()
  );
$$;

revoke all on function public.user_has_athlete_on_fundraiser(uuid) from public;
grant execute on function public.user_has_athlete_on_fundraiser(uuid) to authenticated;
grant execute on function public.user_has_athlete_on_fundraiser(uuid) to service_role;

-- Top raisers (aggregates only — no donor PII). Athletes/coach on the campaign only.
create or replace function public.fundraiser_leaderboard_top(
  p_fundraiser_id uuid,
  p_limit int default 3
)
returns table (
  rank bigint,
  athlete_id uuid,
  full_name text,
  raised numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with allowed as (
    select (
      public.user_has_athlete_on_fundraiser(p_fundraiser_id)
      or exists (
        select 1 from public.fundraisers f
        where f.id = p_fundraiser_id and f.coach_id = auth.uid()
      )
    ) as ok
  ),
  sums as (
    select d.athlete_id, sum(d.amount)::numeric as raised
    from public.donations d
    cross join allowed
    where d.fundraiser_id = p_fundraiser_id
      and allowed.ok
    group by d.athlete_id
  ),
  ranked as (
    select
      row_number() over (order by s.raised desc, s.athlete_id asc) as rank,
      s.athlete_id,
      a.full_name,
      s.raised
    from sums s
    join public.athletes a
      on a.id = s.athlete_id and a.fundraiser_id = p_fundraiser_id
  )
  select r.rank, r.athlete_id, r.full_name, r.raised
  from ranked r
  where r.rank <= greatest(1, least(coalesce(nullif(p_limit, 0), 3), 50))
  order by r.rank;
$$;

revoke all on function public.fundraiser_leaderboard_top(uuid, integer) from public;
grant execute on function public.fundraiser_leaderboard_top(uuid, integer) to authenticated;
grant execute on function public.fundraiser_leaderboard_top(uuid, integer) to service_role;

create policy "Athlete can read fundraiser they belong to"
  on public.fundraisers for select
  to authenticated
  using (public.user_has_athlete_on_fundraiser(id));

-- athletes
create policy "Athlete can read self"
  on public.athletes for select
  to authenticated
  using (user_id = auth.uid());

create policy "Athlete can read visible teammates on same fundraiser"
  on public.athletes for select
  to authenticated
  using (
    show_on_team_roster = true
    and public.user_has_athlete_on_fundraiser(athletes.fundraiser_id)
  );

create policy "Athlete can insert self"
  on public.athletes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Athlete can update self"
  on public.athletes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Coach can read athletes on own fundraiser"
  on public.athletes for select
  to authenticated
  using (
    exists (
      select 1 from public.fundraisers f
      where f.id = athletes.fundraiser_id and f.coach_id = auth.uid()
    )
  );

-- donations
create policy "Coach can read donations for own fundraiser"
  on public.donations for select
  to authenticated
  using (
    exists (
      select 1 from public.fundraisers f
      where f.id = donations.fundraiser_id and f.coach_id = auth.uid()
    )
  );

create policy "Athlete can read own donations"
  on public.donations for select
  to authenticated
  using (
    exists (
      select 1 from public.athletes a
      where a.id = donations.athlete_id and a.user_id = auth.uid()
    )
  );

-- athlete_contacts
create policy "Athlete manages own contacts"
  on public.athlete_contacts for all
  to authenticated
  using (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_contacts.athlete_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_contacts.athlete_id and a.user_id = auth.uid()
    )
  );

create policy "Coach can read contacts for own fundraiser"
  on public.athlete_contacts for select
  to authenticated
  using (
    exists (
      select 1
      from public.athletes a
      join public.fundraisers f on f.id = a.fundraiser_id
      where a.id = athlete_contacts.athlete_id
        and f.coach_id = auth.uid()
    )
  );

-- Storage: logos bucket (create in Dashboard or below)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Public read logos"
  on storage.objects for select
  to public
  using (bucket_id = 'logos');

create policy "Authenticated upload logos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'logos');

create policy "Authenticated update own logos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'logos');

create policy "Authenticated delete own logos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'logos');
