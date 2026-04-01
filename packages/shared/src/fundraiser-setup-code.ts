/**
 * Coach fundraiser setup codes are stored as `HH-XXXX-XXXX` (see admin code generator).
 * Normalizes user input so dashes, spaces, and letter case do not matter.
 */
export function normalizeFundraiserSetupCode(input: string): string {
  const alnum = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (alnum.length >= 10 && alnum.startsWith("HH")) {
    const eight = alnum.slice(2, 10);
    return `HH-${eight.slice(0, 4)}-${eight.slice(4)}`;
  }
  if (alnum.length === 8) {
    return `HH-${alnum.slice(0, 4)}-${alnum.slice(4)}`;
  }
  return input.trim();
}
