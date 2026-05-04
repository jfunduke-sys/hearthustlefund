-- =============================================================================
-- ONE-OFF: Reset app data + delete all auth users except SuperAdmin
-- Run in Supabase Dashboard → SQL Editor (use role: postgres, or owner).
--
-- BEFORE YOU RUN:
-- 1) Set keep_email below to the SAME string as apps/web .env SUPERADMIN_EMAIL.
-- 2) Confirm that user already exists under Authentication → Users (create it if not).
-- 3) Destructive — export or back up first if you need any data.
--
-- AFTER: Coaches/athletes must sign up again. Mobile apps may still show an old
-- session until the user taps Log out or clears app data — sign-out stale clients when testing.
--
-- Storage: SQL cannot bulk-delete storage.objects in all projects. To clear logos:
-- Dashboard → Storage → your bucket → delete files (or Storage API).
-- =============================================================================

DO $$
DECLARE
  keep_email text := 'REPLACE_WITH_SUPERADMIN_EMAIL';
  keep_id uuid;
BEGIN
  SELECT id INTO keep_id
  FROM auth.users
  WHERE lower(trim(email)) = lower(trim(keep_email));

  IF keep_id IS NULL THEN
    RAISE EXCEPTION 'No auth.users row for email %. Fix keep_email or create that user first.', keep_email;
  END IF;

  TRUNCATE TABLE
    public.fundraiser_group_managers,
    public.fundraiser_group_members,
    public.fundraiser_groups,
    public.athlete_contacts,
    public.donations,
    public.athletes,
    public.fundraisers,
    public.fundraiser_codes,
    public.school_requests
  RESTART IDENTITY CASCADE;

  DELETE FROM auth.users WHERE id <> keep_id;
END $$;
