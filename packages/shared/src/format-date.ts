const usDateOnly: Intl.DateTimeFormatOptions = {
  month: "long",
  day: "numeric",
  year: "numeric",
};

/**
 * Renders as "March 28, 2026". For `YYYY-MM-DD` from Postgres, uses UTC so the
 * calendar day does not shift by timezone.
 */
export function formatDisplayDate(input: string | Date | null | undefined): string {
  if (input == null || input === "") return "—";
  if (typeof input === "string") {
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const day = Number(m[3]);
      const d = new Date(Date.UTC(y, mo, day));
      return d.toLocaleDateString("en-US", { ...usDateOnly, timeZone: "UTC" });
    }
  }
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return typeof input === "string" ? input : "—";
  return d.toLocaleDateString("en-US", usDateOnly);
}

/**
 * Renders as "March 28, 2026, 3:45 PM" in the viewer's local timezone.
 */
export function formatDisplayDateTime(
  input: string | Date | null | undefined
): string {
  if (input == null || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return typeof input === "string" ? input : "—";
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
