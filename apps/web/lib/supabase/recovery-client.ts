import { createClient } from "@supabase/supabase-js";

/**
 * Password recovery must work when the organizer opens the email on a
 * different phone/computer than they used to request the link.
 * The regular app client uses PKCE, which only works in that original browser.
 */
export function createRecoveryClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}
