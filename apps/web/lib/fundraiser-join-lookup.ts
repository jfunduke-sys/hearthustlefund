import { createAdminClient } from "@/lib/supabase/admin";
import {
  isValidJoinCodeLookupSegment,
  segmentToStoredJoinCode,
} from "@/lib/join-code";
import type { Fundraiser } from "@heart-and-hustle/shared";

const ACTIVE_SELECT =
  "id, code_used, coach_id, school_name, team_name, total_goal, goal_per_athlete, school_logo_url, team_logo_url, start_date, end_date, status, unique_slug, join_code, created_at";

/**
 * Resolve an active fundraiser by team join code or legacy unique_slug.
 */
export async function loadActiveFundraiserByJoinSegment(
  segment: string
): Promise<Fundraiser | null> {
  const raw = segment.trim();
  if (!raw) return null;

  const admin = createAdminClient();
  const byCode = isValidJoinCodeLookupSegment(raw);
  const q = admin
    .from("fundraisers")
    .select(ACTIVE_SELECT)
    .eq("status", "active");

  const key = byCode ? segmentToStoredJoinCode(raw) : raw;
  const { data, error } = byCode
    ? await q.eq("join_code", key).maybeSingle()
    : await q.eq("unique_slug", raw).maybeSingle();

  if (error) return null;
  return (data as Fundraiser) ?? null;
}

/** Minimal fields for participate + public API */
export async function loadFundraiserJoinPreview(segment: string): Promise<{
  id: string;
  team_name: string;
  school_name: string;
  unique_slug: string;
  join_code: string | null;
} | null> {
  const fr = await loadActiveFundraiserByJoinSegment(segment);
  if (!fr) return null;
  return {
    id: fr.id,
    team_name: fr.team_name,
    school_name: fr.school_name,
    unique_slug: fr.unique_slug,
    join_code: fr.join_code ?? null,
  };
}
