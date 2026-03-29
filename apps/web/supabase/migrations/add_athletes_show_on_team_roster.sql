-- Team participant list in the app: only rows with show_on_team_roster = true are visible to teammates.
alter table public.athletes
  add column if not exists show_on_team_roster boolean not null default true;

comment on column public.athletes.show_on_team_roster is
  'When true, other participants on the same fundraiser can see this person in the app team list.';

-- Head coaches default to hidden until they opt in on the web dashboard.
update public.athletes a
set show_on_team_roster = false
from public.fundraisers f
where a.fundraiser_id = f.id
  and a.user_id = f.coach_id;

drop policy if exists "Athlete can read visible teammates on same fundraiser" on public.athletes;

create policy "Athlete can read visible teammates on same fundraiser"
  on public.athletes for select
  to authenticated
  using (
    show_on_team_roster = true
    and public.user_has_athlete_on_fundraiser(athletes.fundraiser_id)
  );
