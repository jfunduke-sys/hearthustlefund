/** Strip to digits only (same idea as athlete_contacts trigger normalization). */
export function digitsOnlyPhone(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Possible `phone_normalized` values to match a donor-entered phone against
 * `athlete_contacts` (US NANP: 10-digit vs leading 1).
 */
export function phoneNormalizedMatchCandidates(raw: string): string[] {
  const d = digitsOnlyPhone(raw);
  if (d.length < 10) return [];
  const set = new Set<string>();
  set.add(d);
  if (d.length === 11 && d.startsWith("1")) {
    set.add(d.slice(1));
  }
  if (d.length === 10) {
    set.add(`1${d}`);
  }
  return Array.from(set);
}

/** True when two NANP-style strings refer to the same US number (10 vs 11 digits, formatting ignored). */
export function phonesLikelySameUsNanp(a: string, b: string): boolean {
  const ca = phoneNormalizedMatchCandidates(a);
  const cb = phoneNormalizedMatchCandidates(b);
  if (ca.length === 0 || cb.length === 0) return false;
  const setB = new Set(cb);
  return ca.some((x) => setB.has(x));
}
