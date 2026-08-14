import { getSessionUser } from "./auth-user";
import { isCoachAccount } from "./coach-account";
import { getParticipantCampaignAccess } from "./participant-campaign-access";
import { supabase } from "./supabase";

export type PostAuthHref = "/(coach)/dashboard" | "/(tabs)/dashboard";

export async function getPostAuthHrefForCurrentUser(): Promise<PostAuthHref> {
  const user = await getSessionUser();
  if (!user) return "/(tabs)/dashboard";
  const coach = await isCoachAccount(user.id);
  if (coach) return "/(coach)/dashboard";

  const access = await getParticipantCampaignAccess(user.id);
  if (!access.allowed) {
    await supabase.auth.signOut({ scope: "local" });
  }
  return "/(tabs)/dashboard";
}
