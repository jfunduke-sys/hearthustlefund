import Stripe from "stripe";
import { phoneNormalizedMatchCandidates } from "@heart-and-hustle/shared";
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

  const { error: insErr } = await admin.from("donations").insert({
    fundraiser_id: fundraiserId,
    athlete_id: athleteId,
    stripe_payment_id: paymentId,
    stripe_fee_cents: feeCents,
    amount: amountCents / 100,
    donor_name: anonymous ? null : donorName,
    donor_email: donorEmail,
    donor_phone: donorPhone,
    anonymous,
  });

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
