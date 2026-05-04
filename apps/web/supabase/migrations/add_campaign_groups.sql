-- Campaign teams/groups: intake flag, fundraiser flag, groups, member assignment,
-- one group manager per group, and RPCs for scoreboard + group-manager dashboards.
-- Head Organizer = fundraisers.coach_id. Group managers see only their group detail
-- via RPC; scoreboard shows every group's total raised only.

-- Intake: Lead Organizer indicates whether they want to split the campaign into groups.
alter table public.school_requests
  add column if not exists wants_campaign_groups boolean not null default false;

comment on column public.school_requests.wants_campaign_groups is
  'When true, the program asked to use teams/groups with group managers after launch.';

-- Live campaign: copied from school_requests at fundraiser creation; Head Organizer may adjust later (future UI).
alter table public.fundraisers
  add column if not exists uses_campaign_groups boolean not null default false;

comment on column public.fundraisers.uses_campaign_groups is
  'When true, campaign uses fundraiser_groups / managers. Lead Organizer may toggle off on the web dashboard; that deletes all groups, placements, and manager rows.';

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.fundraiser_groups (
  id uuid primary key default gen_random_uuid(),
  fundraiser_id uuid not null references public.fundraisers (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (fundraiser_id, name)
);

create index if not exists idx_fundraiser_groups_fundraiser
  on public.fundraiser_groups (fundraiser_id);

create table if not exists public.fundraiser_group_members (
  athlete_id uuid primary key references public.athletes (id) on delete cascade,
  group_id uuid not null references public.fundraiser_groups (id) on delete cascade
);

create index if not exists idx_fundraiser_group_members_group
  on public.fundraiser_group_members (group_id);

-- One manager per group; each user manages at most one group per fundraiser.
create table if not exists public.fundraiser_group_managers (
  id uuid primary key default gen_random_uuid(),
  fundraiser_id uuid not null references public.fundraisers (id) on delete cascade,
  group_id uuid not null references public.fundraiser_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  unique (group_id),
  unique (fundraiser_id, user_id)
);

create index if not exists idx_fundraiser_group_managers_user
  on public.fundraiser_group_managers (user_id);

create or replace function public.fundraiser_group_managers_sync_fundraiser_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select g.fundraiser_id into strict new.fundraiser_id
  from public.fundraiser_groups g
  where g.id = new.group_id;
  return new;
end;
$$;

drop trigger if exists tr_fundraiser_group_managers_sync_fid on public.fundraiser_group_managers;
create trigger tr_fundraiser_group_managers_sync_fid
  before insert or update of group_id on public.fundraiser_group_managers
  for each row
  execute procedure public.fundraiser_group_managers_sync_fundraiser_id();

create or replace function public.fundraiser_group_members_same_fundraiser()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fa uuid;
  fg uuid;
begin
  select a.fundraiser_id into strict fa
  from public.athletes a
  where a.id = new.athlete_id;

  select g.fundraiser_id into strict fg
  from public.fundraiser_groups g
  where g.id = new.group_id;

  if fa is distinct from fg then
    raise exception 'Participant and group must belong to the same fundraiser';
  end if;
  return new;
end;
$$;

drop trigger if exists tr_fundraiser_group_members_same_fr on public.fundraiser_group_members;
create trigger tr_fundraiser_group_members_same_fr
  before insert or update of athlete_id, group_id on public.fundraiser_group_members
  for each row
  execute procedure public.fundraiser_group_members_same_fundraiser();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.fundraiser_groups enable row level security;
alter table public.fundraiser_group_members enable row level security;
alter table public.fundraiser_group_managers enable row level security;

create policy "Head Organizer can manage fundraiser_groups"
  on public.fundraiser_groups for all
  to authenticated
  using (
    exists (
      select 1 from public.fundraisers f
      where f.id = fundraiser_groups.fundraiser_id and f.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.fundraisers f
      where f.id = fundraiser_groups.fundraiser_id and f.coach_id = auth.uid()
    )
  );

create policy "Group manager can read groups in same fundraiser"
  on public.fundraiser_groups for select
  to authenticated
  using (
    exists (
      select 1
      from public.fundraiser_group_managers gm
      join public.fundraiser_groups g2 on g2.id = gm.group_id
      where g2.fundraiser_id = fundraiser_groups.fundraiser_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Head Organizer can manage fundraiser_group_members"
  on public.fundraiser_group_members for all
  to authenticated
  using (
    exists (
      select 1
      from public.fundraiser_groups g
      join public.fundraisers f on f.id = g.fundraiser_id
      where g.id = fundraiser_group_members.group_id and f.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.fundraiser_groups g
      join public.fundraisers f on f.id = g.fundraiser_id
      where g.id = fundraiser_group_members.group_id and f.coach_id = auth.uid()
    )
  );

create policy "Group manager can read own group members"
  on public.fundraiser_group_members for select
  to authenticated
  using (
    exists (
      select 1 from public.fundraiser_group_managers gm
      where gm.group_id = fundraiser_group_members.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Head Organizer can manage fundraiser_group_managers"
  on public.fundraiser_group_managers for all
  to authenticated
  using (
    exists (
      select 1 from public.fundraisers f
      where f.id = fundraiser_group_managers.fundraiser_id and f.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.fundraisers f
      where f.id = fundraiser_group_managers.fundraiser_id and f.coach_id = auth.uid()
    )
  );

create policy "Group manager can read own manager row"
  on public.fundraiser_group_managers for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER): scope checks without RLS recursion
-- ---------------------------------------------------------------------------

create or replace function public.user_group_manager_scope(p_fundraiser_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select gm.group_id
  from public.fundraiser_group_managers gm
  join public.fundraiser_groups g on g.id = gm.group_id
  where g.fundraiser_id = p_fundraiser_id
    and gm.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.user_group_manager_scope(uuid) from public;
grant execute on function public.user_group_manager_scope(uuid) to authenticated;
grant execute on function public.user_group_manager_scope(uuid) to service_role;

-- Scoreboard: each group's total raised only (names + totals). Coach or any group manager on campaign.
create or replace function public.fundraiser_groups_scoreboard(p_fundraiser_id uuid)
returns table (
  group_id uuid,
  group_name text,
  sort_order int,
  total_raised numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with gate as (
    select (
      exists (
        select 1 from public.fundraisers f
        where f.id = p_fundraiser_id and f.coach_id = auth.uid()
      )
      or exists (
        select 1
        from public.fundraiser_group_managers gm
        join public.fundraiser_groups gx on gx.id = gm.group_id
        where gx.fundraiser_id = p_fundraiser_id and gm.user_id = auth.uid()
      )
    ) as ok
  ),
  grp as (
    select g.id, g.name, g.sort_order
    from public.fundraiser_groups g
    cross join gate
    where g.fundraiser_id = p_fundraiser_id and gate.ok
  ),
  totals as (
    select
      m.group_id,
      coalesce(sum(d.amount), 0)::numeric as total_raised
    from public.fundraiser_group_members m
    join public.donations d
      on d.athlete_id = m.athlete_id and d.fundraiser_id = p_fundraiser_id
    group by m.group_id
  )
  select
    grp.id as group_id,
    grp.name as group_name,
    grp.sort_order,
    coalesce(totals.total_raised, 0::numeric) as total_raised
  from grp
  left join totals on totals.group_id = grp.id
  order by grp.sort_order asc, grp.name asc;
$$;

revoke all on function public.fundraiser_groups_scoreboard(uuid) from public;
grant execute on function public.fundraiser_groups_scoreboard(uuid) to authenticated;
grant execute on function public.fundraiser_groups_scoreboard(uuid) to service_role;

-- Single-row summary for the calling group manager's group only.
create or replace function public.fundraiser_group_manager_my_group_summary(p_fundraiser_id uuid)
returns table (
  group_id uuid,
  group_name text,
  participant_count bigint,
  donation_count bigint,
  raised_total numeric,
  texts_sent bigint,
  avg_texts_per_participant numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with gid as (
    select public.user_group_manager_scope(p_fundraiser_id) as v
  ),
  ok as (
    select (select v from gid) is not null as ok
  ),
  members as (
    select m.athlete_id
    from public.fundraiser_group_members m
    cross join gid
    cross join ok
    where ok.ok and m.group_id = gid.v
  ),
  grp as (
    select g.id, g.name
    from public.fundraiser_groups g
    cross join gid
    cross join ok
    where ok.ok and g.id = gid.v
  ),
  don as (
    select
      count(*)::bigint as donation_count,
      coalesce(sum(d.amount), 0)::numeric as raised_total
    from public.donations d
    where d.fundraiser_id = p_fundraiser_id
      and d.athlete_id in (select athlete_id from members)
  ),
  tx as (
    select count(*)::bigint as texts_sent
    from public.athlete_contacts c
    where c.athlete_id in (select athlete_id from members)
      and c.texted_at is not null
  ),
  pc as (
    select count(*)::bigint as participant_count from members
  )
  select
    grp.id as group_id,
    grp.name as group_name,
    pc.participant_count,
    don.donation_count,
    don.raised_total,
    tx.texts_sent,
    case
      when pc.participant_count > 0
        then round(tx.texts_sent::numeric / pc.participant_count::numeric, 2)
      else null::numeric
    end as avg_texts_per_participant
  from grp
  cross join pc
  cross join don
  cross join tx
  cross join ok
  where ok.ok;
$$;

revoke all on function public.fundraiser_group_manager_my_group_summary(uuid) from public;
grant execute on function public.fundraiser_group_manager_my_group_summary(uuid) to authenticated;
grant execute on function public.fundraiser_group_manager_my_group_summary(uuid) to service_role;

-- Roster + per-participant stats for the manager's group only.
create or replace function public.fundraiser_group_manager_my_roster(p_fundraiser_id uuid)
returns table (
  athlete_id uuid,
  full_name text,
  donation_count bigint,
  raised_total numeric,
  texts_sent bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with gid as (
    select public.user_group_manager_scope(p_fundraiser_id) as v
  ),
  ok as (
    select (select v from gid) is not null as ok
  ),
  base as (
    select a.id as athlete_id, a.full_name
    from public.athletes a
    join public.fundraiser_group_members m on m.athlete_id = a.id
    cross join gid
    cross join ok
    where ok.ok and m.group_id = gid.v and a.fundraiser_id = p_fundraiser_id
  ),
  don as (
    select
      d.athlete_id,
      count(*)::bigint as donation_count,
      coalesce(sum(d.amount), 0)::numeric as raised_total
    from public.donations d
    where d.fundraiser_id = p_fundraiser_id
    group by d.athlete_id
  ),
  tx as (
    select
      c.athlete_id,
      count(*) filter (where c.texted_at is not null)::bigint as texts_sent
    from public.athlete_contacts c
    group by c.athlete_id
  )
  select
    b.athlete_id,
    b.full_name,
    coalesce(don.donation_count, 0::bigint) as donation_count,
    coalesce(don.raised_total, 0::numeric) as raised_total,
    coalesce(tx.texts_sent, 0::bigint) as texts_sent
  from base b
  left join don on don.athlete_id = b.athlete_id
  left join tx on tx.athlete_id = b.athlete_id
  order by b.full_name asc;
$$;

revoke all on function public.fundraiser_group_manager_my_roster(uuid) from public;
grant execute on function public.fundraiser_group_manager_my_roster(uuid) to authenticated;
grant execute on function public.fundraiser_group_manager_my_roster(uuid) to service_role;
