/**
 * Normalize to E.164 for Twilio (US-focused: 10 digits → +1…).
 * Returns null if the number is not usable.
 */
export function normalizeUsToE164(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const d = input.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}
