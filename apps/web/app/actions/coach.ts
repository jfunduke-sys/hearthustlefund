"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearCoachActivationCookie } from "@/app/actions/coach-activation";
import { normalizeFundraiserSetupCode } from "@heart-and-hustle/shared";
import { allocateUniqueJoinCode } from "@/lib/join-code";

async function assertCoach() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function slugifyPart(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function randomSuffix() {
  const chars = "abcdefghijklmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return out;
}

async function ensureUniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  schoolName: string,
  teamName: string
) {
  const year = new Date().getFullYear();
  const base =
    `${slugifyPart(schoolName)}-${slugifyPart(teamName)}-${year}`.replace(
      /^-|-$/g,
      ""
    ) || `campaign-${year}`;

  for (let i = 0; i < 24; i++) {
    const candidate = i === 0 ? base : `${base}-${randomSuffix()}`;
    const { data } = await admin
      .from("fundraisers")
      .select("id")
      .eq("unique_slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  throw new Error("Could not allocate a unique link slug");
}

export async function createFundraiserAction(input: {
  code: string;
  school_name: string;
  team_name: string;
  total_goal: number;
  goal_per_athlete: number | null;
  start_date: string;
  end_date: string;
  school_logo_url: string | null;
  team_logo_url: string | null;
}) {
  const user = await assertCoach();
  const admin = createAdminClient();
  const email = user.email!.toLowerCase().trim();
  const codeNorm = normalizeFundraiserSetupCode(input.code);

  const { data: codeRow, error: codeErr } = await admin
    .from("fundraiser_codes")
    .select("*")
    .eq("code", codeNorm)
    .maybeSingle();

  if (codeErr || !codeRow) throw new Error("Invalid fundraiser code");
  if (codeRow.used) throw new Error("This code has already been used");
  if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
    throw new Error("This code has expired");
  }
  const assigned = codeRow.assigned_to_email?.trim().toLowerCase();
  if (!assigned) {
    throw new Error(
      "This code is not assigned to a coach email. Contact Heart & Hustle support."
    );
  }
  if (assigned !== email) {
    throw new Error(
      "This code is assigned to a different coach email. Sign in with the email that received the code."
    );
  }

  const unique_slug = await ensureUniqueSlug(
    admin,
    input.school_name,
    input.team_name
  );

  const join_code = await allocateUniqueJoinCode(admin);

  const { data: inserted, error: insErr } = await admin
    .from("fundraisers")
    .insert({
      code_used: codeRow.code,
      coach_id: user.id,
      school_name: input.school_name.trim(),
      team_name: input.team_name.trim(),
      total_goal: input.total_goal,
      goal_per_athlete: input.goal_per_athlete,
      school_logo_url: input.school_logo_url,
      team_logo_url: input.team_logo_url,
      start_date: input.start_date,
      end_date: input.end_date,
      status: "active",
      unique_slug,
      join_code,
    })
    .select("unique_slug, join_code")
    .single();

  if (insErr || !inserted) throw new Error(insErr?.message ?? "Insert failed");

  const { error: upErr } = await admin
    .from("fundraiser_codes")
    .update({
      used: true,
      used_at: new Date().toISOString(),
      used_by: user.id,
    })
    .eq("code", codeRow.code);

  if (upErr) throw new Error(upErr.message);

  await clearCoachActivationCookie();
  revalidatePath("/coach/dashboard");
  return {
    unique_slug: inserted.unique_slug as string,
    join_code: inserted.join_code as string,
  };
}

function coachDisplayNameFromEmail(email: string | undefined): string | null {
  if (!email) return null;
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!local) return null;
  return local.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Ensures the head coach has one athlete row for this fundraiser so they can use
 * the mobile app (donate link, texting) with the same login—no extra form.
 */
export async function ensureCoachParticipantAthlete(fundraiserId: string) {
  const user = await assertCoach();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("athletes")
    .select("id")
    .eq("fundraiser_id", fundraiserId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return;

  const { data: fr, error: frErr } = await admin
    .from("fundraisers")
    .select("team_name, coach_id")
    .eq("id", fundraiserId)
    .single();

  if (frErr || !fr || fr.coach_id !== user.id) {
    throw new Error("Invalid fundraiser.");
  }

  const meta = user.user_metadata as { full_name?: string; name?: string } | null;
  const fromMeta =
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.name === "string" && meta.name.trim()) ||
    null;

  const displayName =
    fromMeta ||
    coachDisplayNameFromEmail(user.email ?? undefined) ||
    `Coach · ${fr.team_name}`;

  const { error: insErr } = await admin.from("athletes").insert({
    fundraiser_id: fundraiserId,
    user_id: user.id,
    full_name: displayName.trim(),
    team_name: fr.team_name,
    jersey_number: null,
    personal_goal: null,
    show_on_team_roster: false,
  });

  if (insErr) {
    if (insErr.code === "23505") return;
    throw new Error(insErr.message);
  }

  revalidatePath("/coach/dashboard");
}

export async function createCoachParticipantAthlete(input: {
  fundraiserId: string;
  fullName: string;
  jerseyNumber?: string | null;
}) {
  const user = await assertCoach();
  const supabase = createClient();

  const { data: fr, error: frErr } = await supabase
    .from("fundraisers")
    .select("id, coach_id, team_name")
    .eq("id", input.fundraiserId)
    .maybeSingle();

  if (frErr || !fr || fr.coach_id !== user.id) {
    throw new Error("You can only add yourself as a participant on your own fundraiser.");
  }

  const { data: existing } = await supabase
    .from("athletes")
    .select("id")
    .eq("fundraiser_id", input.fundraiserId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    throw new Error("You already have a participant profile for this campaign.");
  }

  const name = input.fullName.trim();
  if (!name) throw new Error("Enter your name as it should appear to donors.");

  const { error: insErr } = await supabase.from("athletes").insert({
    fundraiser_id: input.fundraiserId,
    user_id: user.id,
    full_name: name,
    team_name: fr.team_name,
    jersey_number: input.jerseyNumber?.trim() || null,
    personal_goal: null,
    show_on_team_roster: false,
  });

  if (insErr) throw new Error(insErr.message);

  revalidatePath("/coach/dashboard");
}

export async function setCoachShowOnTeamRoster(input: {
  athleteId: string;
  fundraiserId: string;
  showOnTeamRoster: boolean;
}) {
  const user = await assertCoach();
  const supabase = createClient();

  const { data: fr, error: frErr } = await supabase
    .from("fundraisers")
    .select("coach_id")
    .eq("id", input.fundraiserId)
    .single();

  if (frErr || !fr || fr.coach_id !== user.id) {
    throw new Error("You can only update roster visibility on your own campaign.");
  }

  const { data: row, error: rowErr } = await supabase
    .from("athletes")
    .select("id, user_id")
    .eq("id", input.athleteId)
    .single();

  if (rowErr || !row || row.user_id !== user.id) {
    throw new Error("Invalid participant profile.");
  }

  const { error: upErr } = await supabase
    .from("athletes")
    .update({ show_on_team_roster: input.showOnTeamRoster })
    .eq("id", input.athleteId);

  if (upErr) throw new Error(upErr.message);

  revalidatePath("/coach/dashboard");
}
