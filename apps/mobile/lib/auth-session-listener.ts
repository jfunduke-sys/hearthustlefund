import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * Subscribes to auth changes. Only **SIGNED_OUT** clears the session in UI.
 * Other events may pass `session: null` briefly (e.g. during refresh); treating
 * that as logout caused instant redirects back to the home screen after sign-in.
 */
export function subscribeSessionPresence(
  setSession: (present: boolean) => void
) {
  return supabase.auth.onAuthStateChange(
    (event: AuthChangeEvent, sess: Session | null) => {
      if (event === "SIGNED_OUT") {
        setSession(false);
        return;
      }
      if (sess) {
        setSession(true);
      }
    }
  );
}
