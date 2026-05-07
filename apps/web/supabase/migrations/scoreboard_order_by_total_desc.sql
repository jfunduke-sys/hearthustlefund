-- Order group scoreboard by amount raised (highest first) for mobile/web consumers.

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
      or exists (
        select 1 from public.athletes a
        where a.fundraiser_id = p_fundraiser_id
          and a.user_id = auth.uid()
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
  ),
  ranked as (
    select
      grp.id as group_id,
      grp.name as group_name,
      grp.sort_order,
      coalesce(totals.total_raised, 0::numeric) as total_raised
    from grp
    left join totals on totals.group_id = grp.id
  )
  select
    ranked.group_id,
    ranked.group_name,
    ranked.sort_order,
    ranked.total_raised
  from ranked
  order by ranked.total_raised desc, ranked.group_name asc;
$$;
