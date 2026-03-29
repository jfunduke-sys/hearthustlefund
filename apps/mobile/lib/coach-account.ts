import { supabase } from "./supabase";

/** True if this user owns at least one fundraiser (coach account). */
export async function isCoachAccount(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("fundraisers")
    .select("id")
    .eq("coach_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return !!data;
}
