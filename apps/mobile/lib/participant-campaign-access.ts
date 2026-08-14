import {
  isFundraiserOpenForParticipantAccess,
  PARTICIPANT_CAMPAIGN_ENDED_MESSAGE,
} from "@heart-and-hustle/shared";
import { isCoachAccount } from "./coach-account";
import { supabase } from "./supabase";

export { PARTICIPANT_CAMPAIGN_ENDED_MESSAGE };

export type ParticipantAccessResult =
  | { allowed: true }
  | { allowed: false; reason: "ended" | "no_athlete" };

/**
 * Whether a signed-in user may use participant (athlete) app routes.
 * Coaches are handled separately and should not call this for coach routes.
 */
export async function getParticipantCampaignAccess(
  userId: string
): Promise<ParticipantAccessResult> {
  const { data: athletes, error } = await supabase
    .from("athletes")
    .select("id, fundraiser_id")
    .eq("user_id", userId);

  if (error || !athletes?.length) {
    return { allowed: false, reason: "no_athlete" };
  }

  const fundraiserIds = Array.from(
    new Set(athletes.map((a) => a.fundraiser_id as string).filter(Boolean))
  );
  if (fundraiserIds.length === 0) {
    return { allowed: false, reason: "no_athlete" };
  }

  const { data: fundraisers, error: frErr } = await supabase
    .from("fundraisers")
    .select("id, status, start_date, end_date")
    .in("id", fundraiserIds);

  if (frErr || !fundraisers?.length) {
    return { allowed: false, reason: "ended" };
  }

  const anyOpen = fundraisers.some((fr) =>
    isFundraiserOpenForParticipantAccess(fr)
  );
  if (anyOpen) return { allowed: true };
  return { allowed: false, reason: "ended" };
}

/**
 * After password sign-in: organizers proceed; participants need an open campaign.
 * Signs the user out when participant access is denied.
 */
export async function assertPostSignInAccess(userId: string): Promise<{
  ok: boolean;
  href: "/(coach)/dashboard" | "/(tabs)/dashboard";
  error?: string;
}> {
  const coach = await isCoachAccount(userId);
  if (coach) {
    return { ok: true, href: "/(coach)/dashboard" };
  }

  const access = await getParticipantCampaignAccess(userId);
  if (access.allowed) {
    return { ok: true, href: "/(tabs)/dashboard" };
  }

  await supabase.auth.signOut({ scope: "local" });
  return {
    ok: false,
    href: "/(tabs)/dashboard",
    error:
      access.reason === "no_athlete"
        ? "No active participant profile found for this account. Join with your team code, or use your Organizer login if you run a campaign."
        : PARTICIPANT_CAMPAIGN_ENDED_MESSAGE,
  };
}
