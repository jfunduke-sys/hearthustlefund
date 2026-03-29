-- Fixes: infinite recursion detected in policy for relation "athletes" (42P17)
-- Cause: fundraisers policy subqueried athletes while athletes policy subqueried fundraisers.
-- Run this in Supabase SQL Editor if your project was created from an older schema.sql.

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

drop policy if exists "Athlete can read fundraiser they belong to" on public.fundraisers;

create policy "Athlete can read fundraiser they belong to"
  on public.fundraisers for select
  to authenticated
  using (public.user_has_athlete_on_fundraiser(id));
