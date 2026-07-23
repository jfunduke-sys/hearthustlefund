"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION } from "@/lib/fundraising-services-agreement-document";

export type FundraiserRequestInput = {
  school_name: string;
  school_district: string;
  school_street: string;
  school_city: string;
  school_state: string;
  school_zip: string;
  sport_club_activity: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_phone: string;
  estimated_athletes: number;
  /** Good-faith estimated fundraising goal (total gross $) for this campaign. */
  estimated_goal: number;
  wants_campaign_groups: boolean;
  fundraiser_start_date: string;
  fundraiser_end_date: string;
  kickoff_setup_preference: string;
  notes: string | null;
  /** Typed electronic signature (full legal name) — organizer/coach. */
  signer_name: string;
  /** Signer title/role, e.g. Coach, Organizer, Athletic Director. */
  signer_title: string;
};

export type FundraiserRequestResult =
  | { ok: true }
  | { ok: false; error: string };

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function validate(input: FundraiserRequestInput): string | null {
  if (!clean(input.school_name)) return "School/organization name is required.";
  if (!clean(input.school_district))
    return "School district or organization is required.";
  if (!clean(input.school_street)) return "Street address is required.";
  if (!clean(input.school_city)) return "City is required.";
  if (!clean(input.school_state)) return "State is required.";
  if (clean(input.school_zip).replace(/\D/g, "").length < 5)
    return "ZIP code must include at least 5 digits.";
  if (!clean(input.sport_club_activity))
    return "Sport, club, or activity is required.";
  if (!clean(input.admin_first_name)) return "Organizer first name is required.";
  if (!clean(input.admin_last_name)) return "Organizer last name is required.";
  if (!clean(input.admin_email)) return "Email is required.";
  if (clean(input.admin_phone).replace(/\D/g, "").length < 10)
    return "Phone number must include at least 10 digits.";
  if (!Number.isFinite(input.estimated_athletes) || input.estimated_athletes < 1)
    return "Enter a valid estimated number of participants (at least 1).";
  if (!Number.isFinite(input.estimated_goal) || input.estimated_goal <= 0)
    return "Enter a valid estimated fundraising goal (total dollars).";
  // Reject non-finite / absurd values; keep dollars as submitted (2dp max).
  if (input.estimated_goal > 1_000_000_000)
    return "Estimated fundraising goal looks too large. Please check the amount.";
  if (!clean(input.fundraiser_start_date) || !clean(input.fundraiser_end_date))
    return "Fundraiser start and end dates are required.";
  if (clean(input.fundraiser_end_date) < clean(input.fundraiser_start_date))
    return "End date must be on or after the start date.";
  if (
    input.kickoff_setup_preference !== "virtual_setup" &&
    input.kickoff_setup_preference !== "self_run"
  )
    return "Please choose how you'd like to prepare for your fundraiser launch.";
  if (!clean(input.signer_name))
    return "Type your full legal name to sign the Fundraising Services Agreement.";
  if (!clean(input.signer_title))
    return "Enter your title/role (e.g. Coach, Organizer, Athletic Director).";
  return null;
}

/**
 * Creates a school request AND a signed Fundraising Services Agreement for
 * THIS campaign (one filed contract per team/campaign request).
 */
export async function submitFundraiserRequest(
  input: FundraiserRequestInput
): Promise<FundraiserRequestResult> {
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const version = FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION;

  const h = headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    null;
  const userAgent = h.get("user-agent")?.slice(0, 500) ?? null;

  const schoolName = clean(input.school_name);
  const district = clean(input.school_district);
  const activity = clean(input.sport_club_activity);
  const startDate = clean(input.fundraiser_start_date);
  const endDate = clean(input.fundraiser_end_date);
  const goal = Number.isFinite(input.estimated_goal)
    ? Math.round(Number(input.estimated_goal) * 100) / 100
    : null;

  // One agreement per campaign request — always create a new signed contract.
  const { data: created, error: createErr } = await admin
    .from("organization_agreements")
    .insert({
      organization_name: district || schoolName,
      school_state: clean(input.school_state) || null,
      school_name: schoolName,
      sport_club_activity: activity || null,
      campaign_start_date: startDate,
      campaign_end_date: endDate,
      agreement_version: version,
      signer_name: clean(input.signer_name),
      signer_title: clean(input.signer_title) || null,
      signer_email: clean(input.admin_email) || null,
      signed_at: now,
      signed_ip: ip,
      signed_user_agent: userAgent,
      estimated_target_gross: goal,
    })
    .select("id")
    .single();

  if (createErr || !created?.id) {
    return {
      ok: false,
      error: createErr?.message || "Could not create the signed agreement.",
    };
  }

  const agreementId = created.id as string;

  const schoolStreet = clean(input.school_street);
  const schoolCity = clean(input.school_city);
  const schoolState = clean(input.school_state);
  const schoolZip = clean(input.school_zip);
  const adminFull = [clean(input.admin_first_name), clean(input.admin_last_name)]
    .filter(Boolean)
    .join(" ");

  const { data: requestRow, error: insertError } = await admin
    .from("school_requests")
    .insert({
      school_name: schoolName,
      school_district: district,
      school_street: schoolStreet,
      school_city: schoolCity,
      school_state: schoolState,
      school_zip: schoolZip,
      school_address: `${schoolStreet}, ${schoolCity}, ${schoolState} ${schoolZip}`,
      sport_club_activity: activity,
      admin_name: adminFull,
      admin_first_name: clean(input.admin_first_name),
      admin_last_name: clean(input.admin_last_name),
      admin_email: clean(input.admin_email),
      admin_phone: clean(input.admin_phone),
      estimated_athletes: input.estimated_athletes,
      estimated_goal: goal,
      wants_campaign_groups: input.wants_campaign_groups,
      fundraiser_start_date: startDate,
      fundraiser_end_date: endDate,
      kickoff_setup_preference: clean(input.kickoff_setup_preference),
      notes: input.notes?.trim() || null,
      status: "pending",
      organization_agreement_id: agreementId,
      signer_name: clean(input.signer_name),
      signer_title: clean(input.signer_title) || null,
      fsa_intake_version: version,
      fsa_intake_acknowledged_at: now,
    })
    .select("id")
    .single();

  if (insertError) {
    // Best-effort cleanup so a failed request doesn't leave an orphan agreement.
    await admin.from("organization_agreements").delete().eq("id", agreementId);
    return { ok: false, error: insertError.message };
  }

  if (requestRow?.id) {
    await admin
      .from("organization_agreements")
      .update({ school_request_id: requestRow.id })
      .eq("id", agreementId);
  }

  return { ok: true };
}
