import type { Athlete, AthleteContact, Donation } from "@heart-and-hustle/shared";

/** 90/10 split vs gross; Stripe fees from stored `stripe_fee_cents` only. */
export type RevenueSplitSnapshot = {
  programCut: number;
  hhCut: number;
  stripeFeesDollars: number;
  /** Heart & Hustle platform share after Stripe processing fees. */
  netHhRevenue: number;
  /** Donations missing a stored Stripe fee (fees understated until resolved). */
  donationsWithUnknownFee: number;
};

/**
 * Program 90% / H&H 10% of gross; Stripe fees summed from known
 * `stripe_fee_cents` on donation rows (same basis as SuperAdmin closed table).
 */
export function computeRevenueSplitFromDonations(
  gross: number,
  donations: Donation[]
): RevenueSplitSnapshot {
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
  const programCut = gross * 0.9;
  const hhCut = gross * 0.1;
  return {
    programCut,
    hhCut,
    stripeFeesDollars,
    netHhRevenue: hhCut - stripeFeesDollars,
    donationsWithUnknownFee: unknown,
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
