/**
 * Default “About this fundraiser” body when `donor_page_about` is empty.
 * With `athleteFullName`, matches each athlete’s donate page; without it, safe
 * for coach UI placeholders (uses “each athlete’s”).
 */
export function getDefaultDonorPageAboutText(
  teamName: string,
  schoolName: string,
  athleteFullName?: string | null
): string {
  const name = athleteFullName?.trim();
  const possessive =
    name && name.length > 0 ? `${name}'s` : "each athlete's";
  return `Your gift supports ${teamName} at ${schoolName}. Funds help the program reach its goals — and directly boost ${possessive} fundraising progress. Thank you for cheering on our student-athletes.`;
}
