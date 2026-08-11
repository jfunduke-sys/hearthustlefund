import type { Athlete, AthleteContact, Donation } from "@heart-and-hustle/shared";
import { normalizeFeeModel, type FeeModel } from "@heart-and-hustle/shared";

/** 90/10 split vs gross; Stripe fees from stored `stripe_fee_cents` only. */
export type RevenueSplitSnapshot = {
  feeModel: FeeModel;
  programCut: number;
  hhCut: number;
  stripeFeesDollars: number;
  /** Heart & Hustle platform share after Stripe processing fees. */
  netHhRevenue: number;
  /** Donations missing a stored Stripe fee (fees understated until resolved). */
  donationsWithUnknownFee: number;
  /** keep_100 extras (0 for 90/10). */
  statedDonations: number;
  electronicPaymentFees: number;
  epfDonorCovered: number;
  epfDeductedFromDonation: number;
  hhSupportTotal: number;
  totalDonorPayments: number;
  supportOptInCount: number;
  supportDeclinedCount: number;
};

/**
 * Program 90% / H&H 10% of gross; Stripe fees summed from known
 * `stripe_fee_cents` on donation rows (same basis as SuperAdmin closed table).
 * For keep_100, programCut = org allocations; H&H = EPF residual + Support − Stripe.
 */
export function computeRevenueSplitFromDonations(
  gross: number,
  donations: Donation[],
  feeModelInput?: FeeModel | null
): RevenueSplitSnapshot {
  const feeModel = normalizeFeeModel(feeModelInput);
  let unknown = 0;
  let feeCents = 0;
  for (const d of donations) {
    const c = d.stripe_fee_cents;
    if (c != null && c >= 0) {
      feeCents += c;
    } else {
      unknown += 1;
    }
  }
  const stripeFeesDollars = feeCents / 100;

  if (feeModel === "keep_100") {
    let stated = 0;
    let epf = 0;
    let epfCovered = 0;
    let epfDeducted = 0;
    let support = 0;
    let totalCharged = 0;
    let supportOn = 0;
    let supportOff = 0;
    let org = 0;
    for (const d of donations) {
      const orgAmt = Number(d.amount) || 0;
      org += orgAmt;
      const statedAmt = Number(d.stated_donation_amount ?? d.amount) || 0;
      stated += statedAmt;
      const epfAmt = Number(d.electronic_payment_fee_amount) || 0;
      epf += epfAmt;
      if (d.fee_payment_mode === "deducted_from_donation") epfDeducted += epfAmt;
      else epfCovered += epfAmt;
      const supportAmt = Number(d.hh_support_amount) || 0;
      support += supportAmt;
      if (supportAmt > 0) supportOn += 1;
      else supportOff += 1;
      totalCharged += Number(d.total_charged_amount ?? d.amount) || 0;
    }
    // H&H keeps EPF + Support; Stripe fees come out of that.
    const hhGross = epf + support;
    return {
      feeModel,
      programCut: org,
      hhCut: hhGross,
      stripeFeesDollars,
      netHhRevenue: hhGross - stripeFeesDollars,
      donationsWithUnknownFee: unknown,
      statedDonations: stated,
      electronicPaymentFees: epf,
      epfDonorCovered: epfCovered,
      epfDeductedFromDonation: epfDeducted,
      hhSupportTotal: support,
      totalDonorPayments: totalCharged,
      supportOptInCount: supportOn,
      supportDeclinedCount: supportOff,
    };
  }

  const programCut = gross * 0.9;
  const hhCut = gross * 0.1;
  return {
    feeModel: "split_90_10",
    programCut,
    hhCut,
    stripeFeesDollars,
    netHhRevenue: hhCut - stripeFeesDollars,
    donationsWithUnknownFee: unknown,
    statedDonations: gross,
    electronicPaymentFees: 0,
    epfDonorCovered: 0,
    epfDeductedFromDonation: 0,
    hhSupportTotal: 0,
    totalDonorPayments: gross,
    supportOptInCount: 0,
    supportDeclinedCount: donations.length,
  };
}

export type FundraiserAnalytics = {
  participantCount: number;
  grossRaised: number;
  donationCount: number;
  donorCount: number;
  avgDonation: number;
  avgRaisedPerAthlete: number;
  textsSent: number;
  /** Donation count / texts sent (0–100), or null if no texts tracked. */
  conversionPercent: number | null;
};

export function computeFundraiserAnalytics(
  fundraiserId: string,
  athletes: Athlete[],
  donations: Donation[],
  contacts: AthleteContact[]
): FundraiserAnalytics {
  const fundAthletes = athletes.filter((a) => a.fundraiser_id === fundraiserId);
  const athleteIds = new Set(fundAthletes.map((a) => a.id));
  const fundDonations = donations.filter((d) => d.fundraiser_id === fundraiserId);
  const fundContacts = contacts.filter((c) => athleteIds.has(c.athlete_id));

  const grossRaised = fundDonations.reduce((s, d) => s + Number(d.amount), 0);
  const donationCount = fundDonations.length;
  const participantCount = fundAthletes.length;
  const textsSent = fundContacts.filter((c) => c.texted_at != null).length;

  const donorCount = donationCount;

  const avgDonation = donationCount > 0 ? grossRaised / donationCount : 0;
  const avgRaisedPerAthlete =
    participantCount > 0 ? grossRaised / participantCount : 0;
  const conversionPercent =
    textsSent > 0 ? Math.min(100, (donationCount / textsSent) * 100) : null;

  return {
    participantCount,
    grossRaised,
    donationCount,
    donorCount,
    avgDonation,
    avgRaisedPerAthlete,
    textsSent,
    conversionPercent,
  };
}
