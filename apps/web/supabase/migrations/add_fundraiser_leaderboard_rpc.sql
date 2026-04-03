-- Aggregated top raisers per fundraiser (no donor PII). Uses SECURITY DEFINER so
-- athletes can see team totals without a broad SELECT policy on donations.

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
