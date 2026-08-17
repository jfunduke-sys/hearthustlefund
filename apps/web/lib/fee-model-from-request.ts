import type { createAdminClient } from "@/lib/supabase/admin";
import { isFeeModel, type FeeModel } from "@heart-and-hustle/shared";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Fee structure from the original school request, if this code is tied to one. */
export async function feeModelForFundraiserCode(
  admin: AdminClient,
  code: string
): Promise<FeeModel> {
  const { data: codeRow } = await admin
    .from("fundraiser_codes")
    .select("school_request_id")
    .eq("code", code)
    .maybeSingle();
  if (!codeRow?.school_request_id) return "split_90_10";

  const { data: sr } = await admin
    .from("school_requests")
    .select("fee_model")
    .eq("id", codeRow.school_request_id)
    .maybeSingle();
  return isFeeModel(sr?.fee_model) ? sr.fee_model : "split_90_10";
}
