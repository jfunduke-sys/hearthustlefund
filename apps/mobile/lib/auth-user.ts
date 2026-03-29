import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * Prefer getSession() so the user id is available immediately after sign-in.
 * getUser() alone can lag on React Native and break RLS-backed queries.
 */
export async function getSessionUser(): Promise<User | null> {
  const { data: sessionWrap } = await supabase.auth.getSession();
  let user = sessionWrap.session?.user ?? null;
  if (!user) {
    const { data: userWrap } = await supabase.auth.getUser();
    user = userWrap.user;
  }
  return user;
}
