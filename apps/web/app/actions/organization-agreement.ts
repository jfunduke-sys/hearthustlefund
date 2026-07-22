"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type CountersignResult = { ok: true } | { ok: false; error: string };

/**
 * Records the Heart & Hustle countersignature on an organization's signed
 * Fundraising Services Agreement (SuperAdmin action, before filing with the state).
 */
export async function countersignOrganizationAgreement(input: {
  id: string;
  countersigned_by: string;
  countersigned_title: string;
}): Promise<CountersignResult> {
  const id = input.id?.trim();
  const by = input.countersigned_by?.trim();
  const title = input.countersigned_title?.trim();
  if (!id) return { ok: false, error: "Missing agreement id." };
  if (!by) return { ok: false, error: "Enter the Heart & Hustle signer name." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("organization_agreements")
    .update({
      countersigned_by: by,
      countersigned_title: title || null,
      countersigned_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/organization-agreement/${id}`);
  return { ok: true };
}

/**
 * Sets/adjusts the estimated target gross for a campaign agreement
 * (225 ILCS 460/7(b) budget). Seeded from intake; SuperAdmin may adjust before
 * filing with the state.
 */
export async function setAgreementEstimatedGross(input: {
  id: string;
  estimated_target_gross: number;
}): Promise<CountersignResult> {
  const id = input.id?.trim();
  if (!id) return { ok: false, error: "Missing agreement id." };
  const gross = Number(input.estimated_target_gross);
  if (!Number.isFinite(gross) || gross <= 0)
    return { ok: false, error: "Enter a valid estimated target gross (dollars)." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("organization_agreements")
    .update({ estimated_target_gross: Math.round(gross * 100) / 100 })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/organization-agreement/${id}`);
  return { ok: true };
}
