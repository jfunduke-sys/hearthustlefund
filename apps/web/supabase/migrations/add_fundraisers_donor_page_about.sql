-- Optional story / description shown on public athlete donate pages.

alter table public.fundraisers
  add column if not exists donor_page_about text;

comment on column public.fundraisers.donor_page_about is
  'Optional HTML-free text for the public donate page “About this fundraiser” section.';
