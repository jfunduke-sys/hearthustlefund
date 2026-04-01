-- =============================================================================
-- ONE-OFF: Reset app data + delete all auth users except super admin
-- Run in Supabase Dashboard → SQL Editor (project owner).
--
-- 1) Replace REPLACE_WITH_SUPERADMIN_EMAIL below with the same address as
--    SUPERADMIN_EMAIL (that user must already exist in Authentication → Users).
-- 2) Run the entire script once. Destructive — back up first if unsure.
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
    public.athlete_contacts,
    public.donations,
    public.athletes,
    public.fundraisers,
    public.fundraiser_codes,
    public.school_requests
  RESTART IDENTITY CASCADE;

  DELETE FROM storage.objects WHERE bucket_id = 'logos';

  DELETE FROM auth.users WHERE id <> keep_id;
END $$;
