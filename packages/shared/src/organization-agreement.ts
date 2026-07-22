/**
 * Campaign-level signed Fundraising Services Agreement.
 *
 * Illinois PFR filing: one signed agreement per campaign (team/sport request),
 * signed by the organizer/coach on intake. Heart & Hustle countersigns before filing.
 */

/** E-signature consent shown next to the typed-name signature on the request form. */
export const ORGANIZATION_AGREEMENT_ESIGN_CONSENT =
  "By typing my full legal name and checking this box, I agree this is my electronic signature; I am authorized to sign this Fundraising Services Agreement on behalf of my organization for this fundraising campaign; and my electronic signature is as legally binding as a handwritten one under the U.S. E-SIGN Act and applicable Illinois law.";

/** Company service fee as a fraction of gross funds raised (the 90/10 split). */
export const FUNDRAISING_SERVICE_FEE_RATE = 0.1;

export interface AgreementBudget {
  /** Estimated gross funds to be raised over the contract term. */
  targetGross: number;
  /** Company service fee (projected fundraising expense) at FUNDRAISING_SERVICE_FEE_RATE. */
  serviceFee: number;
  /** Projected net amount paid to the organization (charity). */
  netToOrganization: number;
  /** Service fee expressed as a percentage string, e.g. "10%". */
  serviceFeePercentLabel: string;
  /** Net-to-organization percentage string, e.g. "90%". */
  netPercentLabel: string;
}

/**
 * Computes the 225 ILCS 460/7(b) estimated budget from a target gross amount.
 * Payment-processing fees are borne by Company out of its service fee, so the
 * organization's only projected fundraising expense is the service fee.
 */
export function computeAgreementBudget(
  targetGross: number | null | undefined,
  feeRate: number = FUNDRAISING_SERVICE_FEE_RATE
): AgreementBudget {
  const gross =
    Number.isFinite(targetGross) && (targetGross ?? 0) > 0
      ? (targetGross as number)
      : 0;
  const serviceFee = Math.round(gross * feeRate * 100) / 100;
  const netToOrganization = Math.round((gross - serviceFee) * 100) / 100;
  return {
    targetGross: gross,
    serviceFee,
    netToOrganization,
    serviceFeePercentLabel: `${Math.round(feeRate * 100)}%`,
    netPercentLabel: `${Math.round((1 - feeRate) * 100)}%`,
  };
}

/** Formats a dollar amount for the agreement/exhibit (USD, no cents when whole). */
export function formatAgreementCurrency(
  amount: number | null | undefined
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export interface OrganizationAgreement {
  id: string;
  organization_name: string;
  school_state: string | null;
  school_name: string | null;
  sport_club_activity: string | null;
  /** Campaign window start (ISO date YYYY-MM-DD). */
  campaign_start_date: string | null;
  /** Campaign window end (ISO date YYYY-MM-DD). */
  campaign_end_date: string | null;
  school_request_id: string | null;
  agreement_version: string;
  signer_name: string;
  signer_title: string | null;
  signer_email: string | null;
  signed_at: string;
  signed_ip: string | null;
  signed_user_agent: string | null;
  countersigned_by: string | null;
  countersigned_title: string | null;
  countersigned_at: string | null;
  /** Estimated target gross for this campaign (225 ILCS 460/7(b)). */
  estimated_target_gross: number | null;
  created_at: string;
}
