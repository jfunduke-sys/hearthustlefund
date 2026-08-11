import Stripe from "stripe";
import {
  isCampaignWindowActiveForDonations,
  phoneNormalizedMatchCandidates,
} from "@heart-and-hustle/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchStripeFeeCentsForPaymentIntent,
  isStripePaymentIntentId,
} from "@/lib/stripe-donation-fee";

/**
 * Idempotent: inserts a `donations` row from a completed Checkout Session.
 * Used by the Stripe webhook and by the thank-you page (e.g. local dev when
 * webhooks cannot reach localhost).
 */
export async function recordDonationFromCheckoutSession(
  session: Stripe.Checkout.Session,
  stripe?: Stripe
): Promise<{ inserted: boolean; skipped: boolean; error?: string }> {
  const md = session.metadata ?? {};
  const athleteId = md.athlete_id;
  const fundraiserId = md.fundraiser_id;
  const amountCents = session.amount_total ?? Number(md.amount_cents);
  if (!athleteId || !fundraiserId || !amountCents) {
    return { inserted: false, skipped: true };
  }

  const paid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  if (!paid) {
    return { inserted: false, skipped: true };
  }

  const paymentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id;

  const admin = createAdminClient();

  const { data: frDates } = await admin
    .from("fundraisers")
    .select("start_date, end_date")
    .eq("id", fundraiserId)
    .maybeSingle();
  if (
    frDates &&
    !isCampaignWindowActiveForDonations(
      String(frDates.start_date ?? ""),
      String(frDates.end_date ?? "")
    )
  ) {
    console.warn(
      "[donation] skipped: outside campaign window",
      fundraiserId
    );
    return { inserted: false, skipped: true };
  }

  const stripeForFees =
    stripe ??
    (process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY)
      : null);

  const { data: existing } = await admin
    .from("donations")
    .select("id, stripe_fee_cents")
    .eq("stripe_payment_id", paymentId)
    .maybeSingle();

  if (existing) {
    if (
      existing.stripe_fee_cents == null &&
      stripeForFees &&
      isStripePaymentIntentId(paymentId)
    ) {
      const fee = await fetchStripeFeeCentsForPaymentIntent(
        stripeForFees,
        paymentId
      );
      if (fee != null) {
        await admin
          .from("donations")
          .update({ stripe_fee_cents: fee })
          .eq("id", existing.id);
      }
    }
    return { inserted: false, skipped: false };
  }

  let feeCents: number | null = null;
  if (stripeForFees && isStripePaymentIntentId(paymentId)) {
    feeCents = await fetchStripeFeeCentsForPaymentIntent(
      stripeForFees,
      paymentId
    );
  }

  const anonymous = md.anonymous === "true";
  const donorName = (md.donor_name || "").trim() || null;
  const donorEmail = (md.donor_email || "").trim() || null;
  const donorPhone = (md.donor_phone || "").trim() || null;

  const feeModel = (md.fee_model || "split_90_10").trim();
  const orgAllocationCents = Number(
    md.org_allocation_cents || md.amount_cents || amountCents
  );
  const statedCents = Number(md.stated_donation_cents || orgAllocationCents);
  const epfCents = Number(md.electronic_payment_fee_cents || 0);
  const supportCents = Number(md.hh_support_cents || 0);
  const totalChargedCents = Number(
    md.total_charged_cents || session.amount_total || amountCents
  );
  const feePaymentMode = (md.fee_payment_mode || "").trim() || null;
  const checkoutMethod = (md.checkout_payment_method || "").trim() || null;

  const orgDollars = (Number.isFinite(orgAllocationCents) ? orgAllocationCents : amountCents) / 100;

  const insertRow: Record<string, unknown> = {
    fundraiser_id: fundraiserId,
    athlete_id: athleteId,
    stripe_payment_id: paymentId,
    stripe_fee_cents: feeCents,
    amount: orgDollars,
    donor_name: anonymous ? null : donorName,
    donor_email: donorEmail,
    donor_phone: donorPhone,
    anonymous,
  };

  if (feeModel === "keep_100") {
    insertRow.fee_model = "keep_100";
    insertRow.stated_donation_amount = statedCents / 100;
    insertRow.electronic_payment_fee_amount = epfCents / 100;
    insertRow.fee_payment_mode = feePaymentMode;
    insertRow.hh_support_amount = supportCents / 100;
    insertRow.total_charged_amount = totalChargedCents / 100;
    insertRow.checkout_payment_method = checkoutMethod;
  } else {
    insertRow.fee_model = "split_90_10";
    insertRow.stated_donation_amount = orgDollars;
    insertRow.total_charged_amount = orgDollars;
    insertRow.electronic_payment_fee_amount = 0;
    insertRow.hh_support_amount = 0;
  }

  const { error: insErr } = await admin.from("donations").insert(insertRow);

  if (insErr) {
    return { inserted: false, skipped: false, error: insErr.message };
  }

  if (donorPhone) {
    const candidates = phoneNormalizedMatchCandidates(donorPhone);
    if (candidates.length > 0) {
      const { error: upErr } = await admin
        .from("athlete_contacts")
        .update({ donated: true })
        .eq("athlete_id", athleteId)
        .in("phone_normalized", candidates);
      if (upErr) console.error("athlete_contacts donated update", upErr);
    }
  }

  return { inserted: true, skipped: false };
}
