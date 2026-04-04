-- Sum of all donations on a campaign (matches coach dashboard team total).
-- Athletes cannot SELECT other athletes' donation rows under RLS; this RPC is allowed
-- for anyone on the fundraiser (athlete or coach), same gate as fundraiser_leaderboard_top.

create or replace function public.fundraiser_total_raised(p_fundraiser_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select case
    when (
      public.user_has_athlete_on_fundraiser(p_fundraiser_id)
      or exists (
        select 1 from public.fundraisers f
        where f.id = p_fundraiser_id and f.coach_id = auth.uid()
      )
    )
    then coalesce(
      (
        select sum(d.amount)::numeric
        from public.donations d
        where d.fundraiser_id = p_fundraiser_id
      ),
      0::numeric
    )
    else null
  end;
$$;

revoke all on function public.fundraiser_total_raised(uuid) from public;
grant execute on function public.fundraiser_total_raised(uuid) to authenticated;
grant execute on function public.fundraiser_total_raised(uuid) to service_role;
