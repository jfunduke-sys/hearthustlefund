/**
 * Fee models for Heart & Hustle fundraisers.
 *
 * - keep_100: Standard for new campaigns. No commission; EPF + optional Support.
 * - split_90_10: Legacy only — see fee-model-split-legacy.ts.
 */

export type FeeModel = "split_90_10" | "keep_100";

export type FeePaymentMode = "donor_covered" | "deducted_from_donation";

/** How the donor will pay in Stripe Checkout (chosen before redirect). */
export type CheckoutPaymentMethod = "card" | "us_bank_account";

export { FEE_MODEL_SPLIT_90_10 } from "./fee-model-split-legacy";
export const FEE_MODEL_KEEP_100: FeeModel = "keep_100";

/** All new campaign requests use 100% back. */
export const DEFAULT_FEE_MODEL_FOR_NEW_REQUESTS: FeeModel = "keep_100";

/** Card Electronic Payment Fee: 3.9% + $0.30 (covers Stripe ≈2.9%+$0.30 + ~1% H&H). */
export const CARD_EPF_RATE = 0.039;
export const CARD_EPF_FIXED_DOLLARS = 0.3;

/** ACH Electronic Payment Fee: 1% platform fee (Stripe ACH is much cheaper). */
export const ACH_EPF_RATE = 0.01;

/** Suggested Heart & Hustle Support (5%, included by default; donor can uncheck). */
export const HH_SUPPORT_SUGGESTED_RATE = 0.05;

export function isFeeModel(v: unknown): v is FeeModel {
  return v === "split_90_10" || v === "keep_100";
}

/** Fallback when fee_model is missing — preserves legacy 90/10 campaigns. */
export function normalizeFeeModel(v: unknown): FeeModel {
  return isFeeModel(v) ? v : "split_90_10";
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function electronicPaymentFeeDollars(
  statedDonation: number,
  method: CheckoutPaymentMethod
): number {
  const stated = Number(statedDonation);
  if (!Number.isFinite(stated) || stated <= 0) return 0;
  if (method === "us_bank_account") {
    return roundMoney(stated * ACH_EPF_RATE);
  }
  return roundMoney(stated * CARD_EPF_RATE + CARD_EPF_FIXED_DOLLARS);
}

export function suggestedHhSupportDollars(statedDonation: number): number {
  const stated = Number(statedDonation);
  if (!Number.isFinite(stated) || stated <= 0) return 0;
  return roundMoney(stated * HH_SUPPORT_SUGGESTED_RATE);
}

export type Keep100CheckoutBreakdown = {
  statedDonation: number;
  electronicPaymentFee: number;
  hhSupport: number;
  /** Amount credited to the organization (team goal / payout). */
  orgAllocation: number;
  /** Total charged to the donor via Stripe. */
  totalCharged: number;
  feeMode: FeePaymentMode;
  paymentMethod: CheckoutPaymentMethod;
};

/**
 * Computes Keep 100% checkout amounts.
 * Server must recalculate — never trust client-provided fee totals.
 */
export function computeKeep100Checkout(input: {
  statedDonation: number;
  feeMode: FeePaymentMode;
  paymentMethod: CheckoutPaymentMethod;
  /** 0 when donor did not opt in. */
  hhSupportDollars: number;
}): Keep100CheckoutBreakdown {
  const stated = roundMoney(Number(input.statedDonation) || 0);
  const epf = electronicPaymentFeeDollars(stated, input.paymentMethod);
  const hhSupport = Math.max(0, roundMoney(Number(input.hhSupportDollars) || 0));
  const feeMode = input.feeMode === "deducted_from_donation"
    ? "deducted_from_donation"
    : "donor_covered";

  const orgAllocation =
    feeMode === "donor_covered"
      ? stated
      : Math.max(0, roundMoney(stated - epf));

  // Donor always pays the stated gift (+ support). EPF is either added on top
  // or taken from the gift (org allocation shrinks); Support is always additive.
  const totalCharged =
    feeMode === "donor_covered"
      ? roundMoney(stated + epf + hhSupport)
      : roundMoney(stated + hhSupport);

  return {
    statedDonation: stated,
    electronicPaymentFee: epf,
    hhSupport,
    orgAllocation,
    totalCharged,
    feeMode,
    paymentMethod: input.paymentMethod,
  };
}

export function formatFeeModelLabel(model: FeeModel | null | undefined): string {
  if (model === "keep_100") return "100% back";
  return "90/10 split";
}
