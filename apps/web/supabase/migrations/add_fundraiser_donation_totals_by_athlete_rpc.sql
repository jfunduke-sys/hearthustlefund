-- Per-athlete donation counts and sums for a fundraiser (aggregated in SQL).
-- Used by the coach/Organizer dashboard roster so stats stay correct when
-- donation rows exceed PostgREST default max rows on a plain SELECT.

create or replace function public.fundraiser_donation_totals_by_athlete(p_fundraiser_id uuid)
returns table (
  athlete_id uuid,
  donation_count bigint,
  raised_total numeric
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
  )
  select
    d.athlete_id,
    count(*)::bigint as donation_count,
    coalesce(sum(d.amount), 0)::numeric as raised_total
  from public.donations d
  cross join allowed
  where d.fundraiser_id = p_fundraiser_id
    and allowed.ok
  group by d.athlete_id;
$$;

revoke all on function public.fundraiser_donation_totals_by_athlete(uuid) from public;
grant execute on function public.fundraiser_donation_totals_by_athlete(uuid) to authenticated;
grant execute on function public.fundraiser_donation_totals_by_athlete(uuid) to service_role;
