import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateRandomTeamJoinCode,
  isLegacyNumericJoinCode,
  isValidTeamJoinCodeFormat,
  normalizeTeamJoinCode,
} from "@heart-and-hustle/shared";

export {
  isLegacyNumericJoinCode,
  isValidTeamJoinCodeFormat,
  normalizeTeamJoinCode,
  shouldLookupFundraiserByJoinCode,
} from "@heart-and-hustle/shared";

/** New 7-char codes or legacy 6-digit numeric. */
export function isValidJoinCodeLookupSegment(s: string): boolean {
  return isValidTeamJoinCodeFormat(s) || isLegacyNumericJoinCode(s);
}

export function segmentToStoredJoinCode(segment: string): string {
  const raw = segment.trim();
  if (isLegacyNumericJoinCode(raw)) {
    return raw.replace(/\D/g, "").slice(0, 6);
  }
  return normalizeTeamJoinCode(raw);
}

/**
 * Allocates a unique 7-character team join code for new fundraisers.
 */
export async function allocateUniqueJoinCode(
  admin: SupabaseClient
): Promise<string> {
  for (let attempt = 0; attempt < 64; attempt++) {
    const code = generateRandomTeamJoinCode();
    const { data } = await admin
      .from("fundraisers")
      .select("id")
      .eq("join_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not allocate a team join code. Try again.");
}

export async function ensureFundraiserJoinCode(
  admin: SupabaseClient,
  fundraiserId: string,
  existing: string | null | undefined
): Promise<string> {
  if (existing) return existing;
  const code = await allocateUniqueJoinCode(admin);
  const { error: upErr } = await admin
    .from("fundraisers")
    .update({ join_code: code })
    .eq("id", fundraiserId)
    .is("join_code", null);
  if (upErr) throw new Error(upErr.message);
  const { data: row } = await admin
    .from("fundraisers")
    .select("join_code")
    .eq("id", fundraiserId)
    .maybeSingle();
  const finalCode = row?.join_code as string | undefined;
  if (finalCode) return finalCode;
  return code;
}
