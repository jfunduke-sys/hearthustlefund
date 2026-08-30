/**
 * Archived 90/10 split fee model — not offered on new campaign requests.
 * Kept for legacy campaigns, checkout, analytics, and signed agreements.
 */

import type { FeeModel } from "./fee-model";

export const FEE_MODEL_SPLIT_90_10: FeeModel = "split_90_10";

/** Company service fee as a fraction of gross (the 90/10 split). */
export const LEGACY_SPLIT_SERVICE_FEE_RATE = 0.1;

/** Request-form copy for the retired 90/10 option. */
export const FEE_STRUCTURE_SPLIT_90_10_COPY = {
  title: "90/10 split",
  summary:
    "Your program receives 90% of every donation. Heart & Hustle keeps 10% as its service fee and takes care of payment processing from that share—not the donor, and not out of your 90%.",
} as const;

/** FSA Section 3 body for signed legacy 90/10 campaigns. */
export const FSA_SECTION_3_SPLIT_90_10 = {
  heading: "90/10 split.",
  body: "90% of funds raised are allocated to Organization. 10% is retained by Company as its service fee. Payment processing is the sole responsibility of Company and is paid from Company's 10% service fee. It is not charged to the donor and does not reduce Organization's 90% share.",
} as const;

/** Exhibit A (d) compensation paragraph for signed legacy 90/10 campaigns. */
export const FSA_EXHIBIT_D_SPLIT_90_10 =
  "Company's only compensation under this Agreement is a service fee equal to ten percent (10%) of the gross funds raised through the Organization's campaign(s), computed as 10% of gross contributions and retained at payout as described in Section 3. All payment-processing fees are paid by Company out of its 10% service fee and are not charged to the Organization or the donor.";
