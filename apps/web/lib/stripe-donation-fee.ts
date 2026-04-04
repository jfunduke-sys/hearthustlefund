import type Stripe from "stripe";

/** True for standard PaymentIntent ids (excludes Checkout Session fallback `cs_…`). */
export function isStripePaymentIntentId(id: string): boolean {
  return /^pi_[a-zA-Z0-9]+$/.test(id);
}

/**
 * Processing fee in cents for a succeeded charge (USD → cents matches Stripe’s `fee` field).
 */
export async function fetchStripeFeeCentsForPaymentIntent(
  stripe: Stripe,
  paymentIntentId: string
): Promise<number | null> {
  if (!isStripePaymentIntentId(paymentIntentId)) return null;
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge.balance_transaction"],
    });
    const charge = pi.latest_charge;
    if (!charge || typeof charge === "string") return null;
    const bt = charge.balance_transaction;
    if (!bt || typeof bt === "string") return null;
    return typeof bt.fee === "number" ? bt.fee : null;
  } catch {
    return null;
  }
}
