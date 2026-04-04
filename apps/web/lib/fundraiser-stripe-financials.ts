import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FundraiserStripeFinancialBreakdown } from "@heart-and-hustle/shared";
import { fetchStripeFeeCentsForPaymentIntent, isStripePaymentIntentId } from "./stripe-donation-fee";

export type { FundraiserStripeFinancialBreakdown };

type DonationFeeRow = {
  id: string;
  stripe_payment_id: string;
  amount: number;
  stripe_fee_cents: number | null;
};

const CHUNK = 8;

async function mapInChunks<T, R>(
  items: T[],
  chunkSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const part = await Promise.all(chunk.map(fn));
    out.push(...part);
  }
  return out;
}

/**
 * Aggregates gross from DB donations and Stripe fees (cached column or live API).
 * Optionally persists newly fetched fees on `donations` for faster future loads.
 */
export async function buildFundraiserStripeFinancialBreakdown(
  stripe: Stripe | null,
  admin: SupabaseClient | null,
  donations: DonationFeeRow[]
): Promise<FundraiserStripeFinancialBreakdown> {
  const donationCount = donations.length;
  const grossDollars = donations.reduce((s, d) => s + Number(d.amount), 0);

  if (donationCount === 0) {
    return {
      stripeConfigured: !!stripe,
      donationCount: 0,
      grossDollars: 0,
      stripeFeesDollars: 0,
      netAfterStripeFeesDollars: 0,
      effectiveFeePercentOfGross: null,
      unresolvedCount: 0,
      resolvedFeeCount: 0,
    };
  }

  if (!stripe) {
    const withStoredFee = donations.filter(
      (d) => d.stripe_fee_cents != null && d.stripe_fee_cents >= 0
    );
    const feesFromDb =
      withStoredFee.reduce((s, d) => s + (d.stripe_fee_cents as number), 0) /
      100;
    const unresolved = donations.length - withStoredFee.length;
    return {
      stripeConfigured: false,
      donationCount,
      grossDollars,
      stripeFeesDollars: feesFromDb,
      netAfterStripeFeesDollars: grossDollars - feesFromDb,
      effectiveFeePercentOfGross:
        grossDollars > 0 && unresolved === 0
          ? (feesFromDb / grossDollars) * 100
          : null,
      unresolvedCount: unresolved,
      resolvedFeeCount: withStoredFee.length,
    };
  }

  let totalFeeCents = 0;
  let resolvedFeeCount = 0;
  let unresolvedCount = 0;

  const needFetch: DonationFeeRow[] = [];

  for (const d of donations) {
    if (d.stripe_fee_cents != null && d.stripe_fee_cents >= 0) {
      totalFeeCents += d.stripe_fee_cents;
      resolvedFeeCount += 1;
      continue;
    }
    if (!isStripePaymentIntentId(d.stripe_payment_id)) {
      unresolvedCount += 1;
      continue;
    }
    needFetch.push(d);
  }

  if (needFetch.length > 0) {
    const fetched = await mapInChunks(needFetch, CHUNK, async (d) => {
      const cents = await fetchStripeFeeCentsForPaymentIntent(
        stripe,
        d.stripe_payment_id
      );
      return { id: d.id, cents };
    });

    for (const { id, cents } of fetched) {
      if (cents != null && cents >= 0) {
        totalFeeCents += cents;
        resolvedFeeCount += 1;
        if (admin) {
          await admin.from("donations").update({ stripe_fee_cents: cents }).eq("id", id);
        }
      } else {
        unresolvedCount += 1;
      }
    }
  }

  const stripeFeesDollars = totalFeeCents / 100;
  const netAfterStripeFeesDollars = grossDollars - stripeFeesDollars;
  const allResolved = unresolvedCount === 0 && resolvedFeeCount === donationCount;

  return {
    stripeConfigured: true,
    donationCount,
    grossDollars,
    stripeFeesDollars,
    netAfterStripeFeesDollars,
    effectiveFeePercentOfGross:
      grossDollars > 0 && allResolved
        ? (stripeFeesDollars / grossDollars) * 100
        : null,
    unresolvedCount,
    resolvedFeeCount,
  };
}
