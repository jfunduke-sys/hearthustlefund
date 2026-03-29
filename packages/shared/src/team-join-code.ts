/**
 * Athlete team join code (distinct from HH campaign setup codes like HH-XXXX-XXXX).
 * Seven alphanumeric characters; stored uppercase. Excludes 0, O, 1, I for readability.
 */
export const TEAM_JOIN_CODE_LENGTH = 7;

/** Allowed characters in new 7-character codes (no 0, O, 1, I). */
export const TEAM_JOIN_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function normalizeTeamJoinCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** True if `s` normalizes to exactly 7 allowed characters. */
export function isValidTeamJoinCodeFormat(s: string): boolean {
  const n = normalizeTeamJoinCode(s);
  if (n.length !== TEAM_JOIN_CODE_LENGTH) return false;
  for (const c of n) {
    if (!TEAM_JOIN_CHARSET.includes(c)) return false;
  }
  return true;
}

export function generateRandomTeamJoinCode(): string {
  let out = "";
  for (let i = 0; i < TEAM_JOIN_CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * TEAM_JOIN_CHARSET.length);
    out += TEAM_JOIN_CHARSET[idx]!;
  }
  return out;
}

/** Legacy numeric 6-digit codes (before 7-char format) may still exist in the DB. */
export function isLegacyNumericJoinCode(s: string): boolean {
  const d = s.trim().replace(/\D/g, "");
  return d.length === 6 && /^\d{6}$/.test(d);
}

/**
 * Use join_code column lookup when the segment looks like a code (new or legacy),
 * otherwise treat as unique_slug.
 */
export function shouldLookupFundraiserByJoinCode(segment: string): boolean {
  const t = segment.trim();
  if (!t) return false;
  if (isValidTeamJoinCodeFormat(t)) return true;
  if (isLegacyNumericJoinCode(t)) return true;
  return false;
}
