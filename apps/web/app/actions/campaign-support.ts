"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSuperAdmin } from "@/app/actions/admin";
import { allocateUniqueJoinCode } from "@/lib/join-code";
import { feeModelForFundraiserCode } from "@/lib/fee-model-from-request";
import { normalizeFundraiserSetupCode } from "@heart-and-hustle/shared";

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

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  const target = email.toLowerCase().trim();
  let page = 1;
  const perPage = 200;
  while (page <= 25) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(error.message);
    const hit = data.users.find(
      (u) => u.email?.toLowerCase().trim() === target
    );
    if (hit) return hit.id;
    if (data.users.length < perPage) break;
    page++;
  }
  return null;
}

/**
 * Ensures an auth user exists for the organizer email. Invites by email when missing
 * so `coach_id` can be set before the organizer sets a password.
 */
async function findOrInviteCoachUserId(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<{ userId: string; invited: boolean }> {
  const target = email.toLowerCase().trim();
  const existing = await findAuthUserIdByEmail(admin, target);
  if (existing) return { userId: existing, invited: false };

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(target, {
    redirectTo: `${base}/coach/dashboard`,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      const retry = await findAuthUserIdByEmail(admin, target);
      if (retry) return { userId: retry, invited: false };
    }
    throw new Error(error.message);
  }
  const uid = data.user?.id;
  if (!uid) throw new Error("Invite did not return a user id.");
  return { userId: uid, invited: true };
}

function coachDisplayNameFromEmail(email: string | undefined): string | null {
  if (!email) return null;
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!local) return null;
  return local.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function coachNameFromSchoolRequestForUser(
  admin: ReturnType<typeof createAdminClient>,
  codeUsed: string | null | undefined,
  coachEmail: string | null | undefined
): Promise<string | null> {
  const code = typeof codeUsed === "string" ? codeUsed.trim() : "";
  const email = coachEmail?.trim().toLowerCase();
  if (!code || !email) return null;

  const { data: codeRow } = await admin
    .from("fundraiser_codes")
    .select("school_request_id")
    .eq("code", code)
    .maybeSingle();

  if (!codeRow?.school_request_id) return null;

  const { data: sr } = await admin
    .from("school_requests")
    .select("admin_email, admin_first_name, admin_last_name, admin_name")
    .eq("id", codeRow.school_request_id)
    .maybeSingle();

  if (!sr) return null;

  const reqEmail = String(sr.admin_email ?? "")
    .trim()
    .toLowerCase();
  if (!reqEmail || reqEmail !== email) return null;

  const first = String(sr.admin_first_name ?? "").trim();
  const last = String(sr.admin_last_name ?? "").trim();
  if (first || last) {
    return [first, last].filter(Boolean).join(" ").trim();
  }

  const full = String(sr.admin_name ?? "").trim();
  return full || null;
}

async function ensureCoachParticipantAthleteSupport(
  admin: ReturnType<typeof createAdminClient>,
  fundraiserId: string,
  coachUserId: string
) {
  const { data: fr, error: frErr } = await admin
    .from("fundraisers")
    .select("team_name, coach_id, code_used")
    .eq("id", fundraiserId)
    .single();

  if (frErr || !fr || fr.coach_id !== coachUserId) {
    throw new Error("Invalid fundraiser.");
  }

  const { data: coachWrap } = await admin.auth.admin.getUserById(coachUserId);
  const coachEmail = coachWrap.user?.email ?? null;

  const meta = coachWrap.user?.user_metadata as {
    full_name?: string;
    name?: string;
  } | null;
  const fromMeta =
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.name === "string" && meta.name.trim()) ||
    null;

  const fromSchoolRequest = await coachNameFromSchoolRequestForUser(
    admin,
    fr.code_used as string | null | undefined,
    coachEmail
  );

  const finalName = (
    (fromSchoolRequest?.trim() || null) ||
    fromMeta ||
    coachDisplayNameFromEmail(coachEmail ?? undefined) ||
    `Organizer · ${fr.team_name}`
  ).trim();

  const { data: existing, error: exErr } = await admin
    .from("athletes")
    .select("id, full_name")
    .eq("fundraiser_id", fundraiserId)
    .eq("user_id", coachUserId)
    .maybeSingle();

  if (exErr) throw new Error(exErr.message);

  if (existing) {
    if (
      fromSchoolRequest?.trim() &&
      existing.full_name.trim() !== fromSchoolRequest.trim()
    ) {
      const { error: upErr } = await admin
        .from("athletes")
        .update({ full_name: fromSchoolRequest.trim() })
        .eq("id", existing.id);
      if (upErr) throw new Error(upErr.message);
    }
    return;
  }

  const { error: insErr } = await admin.from("athletes").insert({
    fundraiser_id: fundraiserId,
    user_id: coachUserId,
    full_name: finalName,
    team_name: fr.team_name,
    jersey_number: null,
    personal_goal: null,
    show_on_team_roster: false,
  });

  if (insErr) {
    if (insErr.code === "23505") return;
    throw new Error(insErr.message);
  }
}

export type SupportCreateFundraiserResult = {
  fundraiserId: string;
  unique_slug: string;
  join_code: string;
  coachUserId: string;
  organizerInvited: boolean;
};

/**
 * SuperAdmin: create an active fundraiser with the HH setup code (marks code used),
 * even before the organizer has finished first login. Ensures an auth user exists
 * (invite when missing) and provisions head-coach participant row.
 */
export async function supportCreateFundraiserFromCode(input: {
  code: string;
  school_name: string;
  team_name: string;
  total_goal: number;
  goal_per_athlete: number | null;
  expected_participants: number | null;
  start_date: string;
  end_date: string;
  school_logo_url: string | null;
  team_logo_url: string | null;
  donor_page_about?: string | null;
  uses_campaign_groups?: boolean;
}): Promise<SupportCreateFundraiserResult> {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const codeNorm = normalizeFundraiserSetupCode(input.code);

  const { data: codeRow, error: codeErr } = await admin
    .from("fundraiser_codes")
    .select("*")
    .eq("code", codeNorm)
    .maybeSingle();

  if (codeErr || !codeRow) throw new Error("Invalid fundraiser code");
  if (codeRow.used) throw new Error("This code has already been used.");
  if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
    throw new Error("This code has expired.");
  }
  const assigned = codeRow.assigned_to_email?.trim().toLowerCase();
  if (!assigned) {
    throw new Error(
      "This code is not assigned to an Organizer email. Assign the code first."
    );
  }

  const { userId: coachUserId, invited } = await findOrInviteCoachUserId(
    admin,
    assigned
  );

  const unique_slug = await ensureUniqueSlug(
    admin,
    input.school_name,
    input.team_name
  );
  const join_code = await allocateUniqueJoinCode(admin);
  const about = input.donor_page_about?.trim() || null;
  const fee_model = await feeModelForFundraiserCode(admin, codeRow.code);

  const { data: inserted, error: insErr } = await admin
    .from("fundraisers")
    .insert({
      code_used: codeRow.code,
      coach_id: coachUserId,
      school_name: input.school_name.trim(),
      team_name: input.team_name.trim(),
      total_goal: input.total_goal,
      goal_per_athlete: input.goal_per_athlete,
      expected_participants: input.expected_participants,
      school_logo_url: input.school_logo_url,
      team_logo_url: input.team_logo_url,
      start_date: input.start_date,
      end_date: input.end_date,
      donor_page_about: about,
      uses_campaign_groups: input.uses_campaign_groups === true,
      fee_model,
      status: "active",
      unique_slug,
      join_code,
    })
    .select("id, unique_slug, join_code")
    .single();

  if (insErr || !inserted) throw new Error(insErr?.message ?? "Insert failed");

  const fundraiserId = inserted.id as string;

  const { error: upErr } = await admin
    .from("fundraiser_codes")
    .update({
      used: true,
      used_at: new Date().toISOString(),
      used_by: coachUserId,
    })
    .eq("code", codeRow.code);

  if (upErr) throw new Error(upErr.message);

  try {
    await ensureCoachParticipantAthleteSupport(admin, fundraiserId, coachUserId);
  } catch {
    /* best-effort */
  }

  revalidatePath("/admin");
  revalidatePath("/coach/dashboard");
  revalidatePath(`/admin/campaign-support/f/${fundraiserId}`);

  return {
    fundraiserId,
    unique_slug: inserted.unique_slug as string,
    join_code: inserted.join_code as string,
    coachUserId,
    organizerInvited: invited,
  };
}

const DONOR_PAGE_ABOUT_MAX = 4000;

export async function supportUpdateFundraiserCore(input: {
  fundraiserId: string;
  school_name: string;
  team_name: string;
  total_goal: number;
  goal_per_athlete: number | null;
  expected_participants: number | null;
  start_date: string;
  end_date: string;
  school_logo_url: string | null;
  team_logo_url: string | null;
  donor_page_about: string | null;
}) {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const about = input.donor_page_about?.trim() ?? "";
  if (about.length > DONOR_PAGE_ABOUT_MAX) {
    throw new Error(
      `Donor page message must be ${DONOR_PAGE_ABOUT_MAX.toLocaleString()} characters or less.`
    );
  }

  const { data: fr, error: frErr } = await admin
    .from("fundraisers")
    .select("id, status")
    .eq("id", input.fundraiserId)
    .single();

  if (frErr || !fr) throw new Error("Fundraiser not found.");
  if (fr.status !== "active") {
    throw new Error("Campaign support edits are limited to active fundraisers.");
  }

  const { error: upErr } = await admin
    .from("fundraisers")
    .update({
      school_name: input.school_name.trim(),
      team_name: input.team_name.trim(),
      total_goal: input.total_goal,
      goal_per_athlete: input.goal_per_athlete,
      expected_participants: input.expected_participants,
      start_date: input.start_date,
      end_date: input.end_date,
      school_logo_url: input.school_logo_url,
      team_logo_url: input.team_logo_url,
      donor_page_about: about.length > 0 ? about : null,
    })
    .eq("id", input.fundraiserId);

  if (upErr) throw new Error(upErr.message);

  revalidatePath("/admin");
  revalidatePath("/coach/dashboard");
  revalidatePath(`/admin/fundraisers/${input.fundraiserId}`);
  revalidatePath(`/admin/campaign-support/f/${input.fundraiserId}`);
}

export async function supportUpdateUsesCampaignGroups(input: {
  fundraiserId: string;
  usesCampaignGroups: boolean;
}) {
  await assertSuperAdmin();
  const admin = createAdminClient();

  const { data: fr, error: frErr } = await admin
    .from("fundraisers")
    .select("id, status")
    .eq("id", input.fundraiserId)
    .single();

  if (frErr || !fr) throw new Error("Fundraiser not found.");
  if (fr.status !== "active") {
    throw new Error("Campaign support edits are limited to active fundraisers.");
  }

  if (!input.usesCampaignGroups) {
    const { error: delGErr } = await admin
      .from("fundraiser_groups")
      .delete()
      .eq("fundraiser_id", input.fundraiserId);
    if (delGErr) throw new Error(delGErr.message);
  }

  const { error: upErr } = await admin
    .from("fundraisers")
    .update({ uses_campaign_groups: input.usesCampaignGroups })
    .eq("id", input.fundraiserId);

  if (upErr) throw new Error(upErr.message);

  revalidatePath("/admin");
  revalidatePath("/coach/dashboard");
  revalidatePath(`/admin/campaign-support/f/${input.fundraiserId}`);
}

const MIN_GROUPS = 1;
const MAX_GROUPS = 25;
const GROUP_NAME_MAX = 80;

export async function supportReplaceFundraiserGroupShells(input: {
  fundraiserId: string;
  groupCount: number;
}) {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const n = input.groupCount;
  if (!Number.isFinite(n) || n < MIN_GROUPS || n > MAX_GROUPS) {
    throw new Error(`Use between ${MIN_GROUPS} and ${MAX_GROUPS} groups.`);
  }

  const { data: fr, error: frErr } = await admin
    .from("fundraisers")
    .select("id, status")
    .eq("id", input.fundraiserId)
    .single();
  if (frErr || !fr || fr.status !== "active") {
    throw new Error("Fundraiser not found or not active.");
  }

  const { error: delErr } = await admin
    .from("fundraiser_groups")
    .delete()
    .eq("fundraiser_id", input.fundraiserId);
  if (delErr) throw new Error(delErr.message);

  const rows = Array.from({ length: n }, (_, i) => ({
    fundraiser_id: input.fundraiserId,
    name: `Group ${i + 1}`,
    sort_order: i,
  }));
  const { error: insErr } = await admin.from("fundraiser_groups").insert(rows);
  if (insErr) throw new Error(insErr.message);

  revalidatePath("/admin");
  revalidatePath("/coach/dashboard");
  revalidatePath(`/admin/campaign-support/f/${input.fundraiserId}`);
}

export async function supportRenameFundraiserGroup(input: {
  fundraiserId: string;
  groupId: string;
  name: string;
}) {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const nm = input.name.trim();
  if (nm.length < 1 || nm.length > GROUP_NAME_MAX) {
    throw new Error(`Name must be 1–${GROUP_NAME_MAX} characters.`);
  }

  const { data: g, error: gErr } = await admin
    .from("fundraiser_groups")
    .select("id, fundraiser_id")
    .eq("id", input.groupId)
    .single();
  if (gErr || !g || g.fundraiser_id !== input.fundraiserId) {
    throw new Error("Invalid group.");
  }

  const { error: upErr } = await admin
    .from("fundraiser_groups")
    .update({ name: nm })
    .eq("id", input.groupId);
  if (upErr) throw new Error(upErr.message);

  revalidatePath("/admin");
  revalidatePath("/coach/dashboard");
  revalidatePath(`/admin/campaign-support/f/${input.fundraiserId}`);
}

export async function supportSetFundraiserParticipantGroup(input: {
  fundraiserId: string;
  athleteId: string;
  groupId: string | null;
}) {
  await assertSuperAdmin();
  const admin = createAdminClient();

  const { data: fr, error: frErr } = await admin
    .from("fundraisers")
    .select("id, status")
    .eq("id", input.fundraiserId)
    .single();
  if (frErr || !fr || fr.status !== "active") {
    throw new Error("Fundraiser not found or not active.");
  }

  const { data: ath, error: aErr } = await admin
    .from("athletes")
    .select("id, fundraiser_id")
    .eq("id", input.athleteId)
    .single();
  if (aErr || !ath || ath.fundraiser_id !== input.fundraiserId) {
    throw new Error("Invalid participant.");
  }

  if (input.groupId == null) {
    const { error: delErr } = await admin
      .from("fundraiser_group_members")
      .delete()
      .eq("athlete_id", input.athleteId);
    if (delErr) throw new Error(delErr.message);
    revalidatePath("/admin");
    revalidatePath("/coach/dashboard");
    revalidatePath(`/admin/campaign-support/f/${input.fundraiserId}`);
    return;
  }

  const { data: grp, error: grpErr } = await admin
    .from("fundraiser_groups")
    .select("id, fundraiser_id")
    .eq("id", input.groupId)
    .single();
  if (grpErr || !grp || grp.fundraiser_id !== input.fundraiserId) {
    throw new Error("Invalid group.");
  }

  const { error: upErr } = await admin.from("fundraiser_group_members").upsert(
    { athlete_id: input.athleteId, group_id: input.groupId },
    { onConflict: "athlete_id" }
  );
  if (upErr) throw new Error(upErr.message);

  revalidatePath("/admin");
  revalidatePath("/coach/dashboard");
  revalidatePath(`/admin/campaign-support/f/${input.fundraiserId}`);
}

export async function supportSetFundraiserGroupManager(input: {
  fundraiserId: string;
  groupId: string;
  managerUserId: string | null;
}) {
  await assertSuperAdmin();
  const admin = createAdminClient();

  const { data: fr, error: frErr } = await admin
    .from("fundraisers")
    .select("id, status")
    .eq("id", input.fundraiserId)
    .single();
  if (frErr || !fr || fr.status !== "active") {
    throw new Error("Fundraiser not found or not active.");
  }

  const { data: grp, error: grpErr } = await admin
    .from("fundraiser_groups")
    .select("id, fundraiser_id")
    .eq("id", input.groupId)
    .single();
  if (grpErr || !grp || grp.fundraiser_id !== input.fundraiserId) {
    throw new Error("Invalid group.");
  }

  if (input.managerUserId == null) {
    const { error: delErr } = await admin
      .from("fundraiser_group_managers")
      .delete()
      .eq("group_id", input.groupId);
    if (delErr) throw new Error(delErr.message);
    revalidatePath("/admin");
    revalidatePath("/coach/dashboard");
    revalidatePath(`/admin/campaign-support/f/${input.fundraiserId}`);
    return;
  }

  const { data: ath, error: aErr } = await admin
    .from("athletes")
    .select("id")
    .eq("fundraiser_id", input.fundraiserId)
    .eq("user_id", input.managerUserId)
    .maybeSingle();
  if (aErr || !ath) {
    throw new Error(
      "Group managers must be a participant on this campaign with a mobile app account (signed in at least once)."
    );
  }

  await admin
    .from("fundraiser_group_managers")
    .delete()
    .eq("fundraiser_id", input.fundraiserId)
    .eq("user_id", input.managerUserId);
  await admin.from("fundraiser_group_managers").delete().eq("group_id", input.groupId);

  const { error: insErr } = await admin.from("fundraiser_group_managers").insert({
    fundraiser_id: input.fundraiserId,
    group_id: input.groupId,
    user_id: input.managerUserId,
  });
  if (insErr) throw new Error(insErr.message);

  const { error: placeErr } = await admin.from("fundraiser_group_members").upsert(
    { athlete_id: ath.id, group_id: input.groupId },
    { onConflict: "athlete_id" }
  );
  if (placeErr) throw new Error(placeErr.message);

  revalidatePath("/admin");
  revalidatePath("/coach/dashboard");
  revalidatePath(`/admin/campaign-support/f/${input.fundraiserId}`);
}

export async function supportValidateCodeForCreate(
  code: string
): Promise<
  | { ok: true; assigned_to_email: string | null }
  | { ok: false; error: string }
> {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const codeNorm = normalizeFundraiserSetupCode(code);
  if (!codeNorm) return { ok: false, error: "Enter a valid HH code." };

  const { data: row, error } = await admin
    .from("fundraiser_codes")
    .select("used, expires_at, assigned_to_email")
    .eq("code", codeNorm)
    .maybeSingle();

  if (error || !row) return { ok: false, error: "Code not found." };
  if (row.used) return { ok: false, error: "This code has already been used." };
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { ok: false, error: "This code has expired." };
  }
  if (!row.assigned_to_email?.trim()) {
    return {
      ok: false,
      error: "This code is not assigned to an organizer email.",
    };
  }
  return {
    ok: true,
    assigned_to_email: row.assigned_to_email?.trim() ?? null,
  };
}

export type SupportNewFundraiserPrefill = {
  school_name: string;
  team_name: string;
  start_date: string;
  end_date: string;
  participant_count: number | null;
  wants_campaign_groups: boolean;
  assigned_to_email: string | null;
};

/**
 * SuperAdmin: intake prefill for a fundraiser code (no organizer session required).
 */
export async function supportGetNewFundraiserPrefillForCode(
  code: string
): Promise<SupportNewFundraiserPrefill | null> {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const codeNorm = normalizeFundraiserSetupCode(code);

  const { data: codeRow, error: codeErr } = await admin
    .from("fundraiser_codes")
    .select("school_request_id, assigned_to_email")
    .eq("code", codeNorm)
    .maybeSingle();

  if (codeErr || !codeRow) return null;

  if (!codeRow.school_request_id) {
    return {
      school_name: "",
      team_name: "",
      start_date: "",
      end_date: "",
      participant_count: null,
      wants_campaign_groups: false,
      assigned_to_email: codeRow.assigned_to_email ?? null,
    };
  }

  const { data: sr, error: srErr } = await admin
    .from("school_requests")
    .select(
      "school_name, sport_club_activity, fundraiser_start_date, fundraiser_end_date, estimated_athletes, wants_campaign_groups"
    )
    .eq("id", codeRow.school_request_id)
    .maybeSingle();

  if (srErr || !sr) {
    return {
      school_name: "",
      team_name: "",
      start_date: "",
      end_date: "",
      participant_count: null,
      wants_campaign_groups: false,
      assigned_to_email: codeRow.assigned_to_email ?? null,
    };
  }

  const fmt = (d: string | null | undefined) =>
    typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)
      ? d.slice(0, 10)
      : "";

  return {
    school_name: sr.school_name?.trim() ?? "",
    team_name: (sr.sport_club_activity as string | null)?.trim() ?? "",
    start_date: fmt(sr.fundraiser_start_date as string | null | undefined),
    end_date: fmt(sr.fundraiser_end_date as string | null | undefined),
    participant_count:
      typeof sr.estimated_athletes === "number" && sr.estimated_athletes > 0
        ? sr.estimated_athletes
        : null,
    wants_campaign_groups: sr.wants_campaign_groups === true,
    assigned_to_email: codeRow.assigned_to_email ?? null,
  };
}
