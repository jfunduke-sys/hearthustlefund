/**
 * Intake form “standard fundraiser terms” — bump {@link FUNDRAISER_INTAKE_TERMS_VERSION}
 * when the binding summary changes so new submissions are tied to the new text.
 */
export const FUNDRAISER_INTAKE_TERMS_VERSION = "1" as const;

/** Shown next to the agreement checkbox; details are in the expandable section below. */
export const FUNDRAISER_INTAKE_TERMS_CHECKBOX_INTRO =
  "I have read and agree to the standard fundraiser terms for Heart & Hustle Fundraising.";

export const FUNDRAISER_INTAKE_TERMS_BULLETS: readonly string[] = [
  "Net fundraising proceeds are split 90% to your school or organization and 10% to Heart & Hustle Fundraising, as set out in the written fundraising agreement.",
  "Official campaign start and end dates are determined by you (coach/sponsor) in coordination with Heart & Hustle. Dates you enter on this request are proposed only until confirmed in writing.",
  "After your campaign closes, we aim to process payouts within 5 business days; many payouts arrive within 2–3 business days, subject to bank timing and any required account checks.",
  "A valid W-9 must be on file before we can send a payout to your school or organization.",
  "A signed fundraising agreement, W-9, and any other required paperwork are still required to launch. This checkbox confirms you understand these standard terms; it does not replace the written agreement.",
];
