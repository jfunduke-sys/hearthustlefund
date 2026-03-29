import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const athleteSignupBodySchema = z.object({
  fundraiserId: z.string().uuid(),
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(1).max(200),
  teamName: z.string().trim().min(1).max(200),
  jerseyNumber: z.string().trim().max(20).nullable().optional(),
});

export type AthleteSignupResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function registerAthleteParticipant(
  raw: unknown
): Promise<AthleteSignupResult> {
  const parsed = athleteSignupBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request.", status: 400 };
  }
  const { fundraiserId, email, password, fullName, teamName, jerseyNumber } =
    parsed.data;

  const admin = createAdminClient();
  const { data: fr, error: frErr } = await admin
    .from("fundraisers")
    .select("id, team_name, status")
    .eq("id", fundraiserId)
    .maybeSingle();

  if (frErr) {
    return {
      ok: false,
      error: "Could not verify fundraiser.",
      status: 500,
    };
  }
  if (!fr || fr.status !== "active") {
    return {
      ok: false,
      error: "This fundraiser is not available for new joins.",
      status: 404,
    };
  }
  if (fr.team_name.trim() !== teamName.trim()) {
    return {
      ok: false,
      error: "Team does not match this fundraiser. Go back and join again.",
      status: 400,
    };
  }

  const { data: created, error: cuErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (cuErr) {
    const msg = cuErr.message.toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      return {
        ok: false,
        error:
          "This email already has an account. Sign in from the home screen, then use Team join to open this campaign.",
        status: 409,
      };
    }
    return { ok: false, error: cuErr.message, status: 400 };
  }

  const userId = created.user.id;

  const { error: insErr } = await admin.from("athletes").insert({
    fundraiser_id: fundraiserId,
    user_id: userId,
    full_name: fullName,
    team_name: fr.team_name,
    jersey_number: jerseyNumber?.trim() ? jerseyNumber.trim() : null,
    personal_goal: null,
  });

  if (insErr) {
    await admin.auth.admin.deleteUser(userId);
    if (insErr.code === "23505") {
      return {
        ok: false,
        error: "You're already on this team. Sign in to open your dashboard.",
        status: 409,
      };
    }
    return { ok: false, error: insErr.message, status: 400 };
  }

  return { ok: true };
}
