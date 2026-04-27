/**
 * Intake form “standard fundraiser terms” — bump {@link FUNDRAISER_INTAKE_TERMS_VERSION}
 * when the binding summary changes so new submissions are tied to the new text.
 */
export const FUNDRAISER_INTAKE_TERMS_VERSION = "4" as const;

/** Shown next to the agreement checkbox; details are in the expandable section below. */
export const FUNDRAISER_INTAKE_TERMS_CHECKBOX_INTRO =
  "I have read and agree to the following summary of key commercial and operational terms (in addition to the Fundraising Services Agreement above).";

export const FUNDRAISER_INTAKE_TERMS_BULLETS: readonly string[] = [
  "The Fundraising Services Agreement (required checkbox above) is the main program contract. This list only summarizes a few high-level commercial and operating points; the signed FSA and your W-9 control where they differ.",
  "Net fundraising proceeds are split 90% to your school or organization and 10% to Heart & Hustle Fundraising. Card and payment processing costs are the Company's responsibility and are not deducted from your organization's 90% share, as in the Fundraising Services Agreement.",
  "Official campaign start and end dates are determined by you (coach/sponsor) in coordination with Heart & Hustle. Dates you enter on this request are proposed only until confirmed in writing.",
  "After your campaign closes, we aim to process payouts within 5 business days; many payouts arrive within 2–3 business days, subject to bank timing and any required account checks.",
  "A valid W-9 must be on file before we can send a payout to your school or organization.",
  "This summary does not replace the full Fundraising Services Agreement you will sign with an authorized representative for your organization.",
];
