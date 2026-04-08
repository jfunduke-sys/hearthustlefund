import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUsToE164 } from "@/lib/sms-phone";

export const athleteSignupBodySchema = z
  .object({
    fundraiserId: z.string().uuid(),
    email: z.string().email().transform((e) => e.toLowerCase().trim()),
    password: z.string().min(8).max(128),
    fullName: z.string().trim().min(1).max(200),
    teamName: z.string().trim().min(1).max(200),
    jerseyNumber: z.string().trim().max(20).nullable().optional(),
    /** Consent to automated fundraiser reminder SMS (Twilio). */
    smsRemindersOptIn: z.boolean(),
    /** US mobile; required when smsRemindersOptIn is true. */
    mobilePhone: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.smsRemindersOptIn) return;
    const normalized = normalizeUsToE164(data.mobilePhone ?? "");
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Enter a valid US mobile number (10 digits) to receive text reminders.",
        path: ["mobilePhone"],
      });
    }
  });

export type AthleteSignupResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function registerAthleteParticipant(
  raw: unknown
): Promise<AthleteSignupResult> {
  const parsed = athleteSignupBodySchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const field =
      flat.fieldErrors.mobilePhone?.[0] ??
      flat.fieldErrors.smsRemindersOptIn?.[0] ??
      parsed.error.errors[0]?.message;
    return {
      ok: false,
      error: field ?? "Invalid request.",
      status: 400,
    };
  }
  const {
    fundraiserId,
    email,
    password,
    fullName,
    teamName,
    jerseyNumber,
    smsRemindersOptIn,
    mobilePhone,
  } = parsed.data;

  const smsE164 =
    smsRemindersOptIn && mobilePhone
      ? normalizeUsToE164(mobilePhone)
      : null;
  if (smsRemindersOptIn && !smsE164) {
    return {
      ok: false,
      error:
        "Enter a valid US mobile number (10 digits) to receive text reminders.",
      status: 400,
    };
  }

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
    user_metadata: {
      sms_reminders_opt_in: smsRemindersOptIn,
      ...(smsE164 ? { sms_phone: smsE164 } : {}),
    },
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
