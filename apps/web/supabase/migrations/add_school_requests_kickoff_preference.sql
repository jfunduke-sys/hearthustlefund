-- How the school wants to launch: HH rep on-site vs self-run kickoff.

alter table public.school_requests
  add column if not exists kickoff_setup_preference text;

comment on column public.school_requests.kickoff_setup_preference is
  'Intake: hh_rep_in_person | self_run';
