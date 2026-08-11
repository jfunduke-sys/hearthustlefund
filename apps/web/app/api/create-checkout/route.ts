import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_DONATION_DOLLARS } from "@/lib/brand";
import {
  computeKeep100Checkout,
  isCampaignWindowActiveForDonations,
  normalizeFeeModel,
  type CheckoutPaymentMethod,
  type FeePaymentMode,
} from "@heart-and-hustle/shared";

const bodySchema = z.object({
  amountDollars: z.number().min(MIN_DONATION_DOLLARS),
  donor_name: z.string().nullable(),
  donor_email: z.string().nullable(),
  donor_phone: z.string().nullable(),
  anonymous: z.boolean(),
  athlete_id: z.string().uuid(),
  fundraiser_id: z.string().uuid(),
  token: z.string().min(8),
  /** keep_100 only — ignored for 90/10. */
  feePaymentMode: z
    .enum(["donor_covered", "deducted_from_donation"])
    .optional(),
  paymentMethod: z.enum(["card", "us_bank_account"]).optional(),
  /** keep_100 only — 0 when not opted in. */
  hhSupportDollars: z.number().min(0).max(100_000).optional(),
});

export async function POST(request: Request) {
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }
  const stripe = new Stripe(sk);
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = parsed.data;

  const admin = createAdminClient();
  const { data: athlete } = await admin
    .from("athletes")
    .select("id, unique_link_token, fundraiser_id")
    .eq("id", b.athlete_id)
    .eq("fundraiser_id", b.fundraiser_id)
    .eq("unique_link_token", b.token)
    .maybeSingle();

  if (!athlete) {
    return NextResponse.json({ error: "Invalid donation link" }, { status: 400 });
  }

  const { data: fr } = await admin
    .from("fundraisers")
    .select("id, status, start_date, end_date, fee_model")
    .eq("id", b.fundraiser_id)
    .single();

  if (!fr || fr.status !== "active") {
    return NextResponse.json({ error: "Fundraiser not active" }, { status: 400 });
  }

  const start = String(fr.start_date ?? "");
  const end = String(fr.end_date ?? "");
  if (!isCampaignWindowActiveForDonations(start, end)) {
    return NextResponse.json(
      {
        error:
          "Donations are only accepted during the campaign dates (Central Time).",
      },
      { status: 400 }
    );
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const feeModel = normalizeFeeModel(fr.fee_model);

  // —— Existing 90/10 path (unchanged economics) ——
  if (feeModel !== "keep_100") {
    const amountCents = Math.round(b.amountDollars * 100);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Donation — Heart & Hustle`,
              description: `Supporting fundraiser (${b.athlete_id.slice(0, 8)}…)`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/donate/${encodeURIComponent(b.token)}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/donate/${encodeURIComponent(b.token)}`,
      metadata: {
        athlete_id: b.athlete_id,
        fundraiser_id: b.fundraiser_id,
        donor_name: b.donor_name ?? "",
        donor_email: b.donor_email ?? "",
        donor_phone: b.donor_phone ?? "",
        anonymous: b.anonymous ? "true" : "false",
        amount_cents: String(amountCents),
        fee_model: "split_90_10",
        org_allocation_cents: String(amountCents),
        total_charged_cents: String(amountCents),
        stated_donation_cents: String(amountCents),
      },
    });
    return NextResponse.json({ sessionId: session.id });
  }

  // —— Keep 100% path ——
  const paymentMethod: CheckoutPaymentMethod =
    b.paymentMethod === "us_bank_account" ? "us_bank_account" : "card";
  const feeMode: FeePaymentMode =
    b.feePaymentMode === "deducted_from_donation"
      ? "deducted_from_donation"
      : "donor_covered";
  const support = Math.max(0, Number(b.hhSupportDollars) || 0);

  const breakdown = computeKeep100Checkout({
    statedDonation: b.amountDollars,
    feeMode,
    paymentMethod,
    hhSupportDollars: support,
  });

  if (breakdown.orgAllocation < MIN_DONATION_DOLLARS && feeMode === "deducted_from_donation") {
    return NextResponse.json(
      {
        error: `After the Electronic Payment Fee, the organization would receive less than $${MIN_DONATION_DOLLARS}. Increase your donation or cover the fee instead.`,
      },
      { status: 400 }
    );
  }

  const statedCents = Math.round(breakdown.statedDonation * 100);
  const epfCents = Math.round(breakdown.electronicPaymentFee * 100);
  const supportCents = Math.round(breakdown.hhSupport * 100);
  const orgCents = Math.round(breakdown.orgAllocation * 100);
  const totalCents = Math.round(breakdown.totalCharged * 100);

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  if (feeMode === "donor_covered") {
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Donation to organization",
          description: "Full stated donation — organization keeps 100%",
        },
        unit_amount: statedCents,
      },
      quantity: 1,
    });
    if (epfCents > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Electronic Payment Fee",
            description:
              paymentMethod === "us_bank_account"
                ? "1% Electronic Payment Fee (bank / ACH)"
                : "3.9% + $0.30 Electronic Payment Fee (card)",
          },
          unit_amount: epfCents,
        },
        quantity: 1,
      });
    }
  } else {
    // Fee taken from gift: show org net + EPF so receipt is transparent.
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Donation to organization",
          description: "Stated donation after Electronic Payment Fee",
        },
        unit_amount: orgCents,
      },
      quantity: 1,
    });
    if (epfCents > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Electronic Payment Fee",
            description: "Deducted from stated donation (organization receives the remainder)",
          },
          unit_amount: epfCents,
        },
        quantity: 1,
      });
    }
  }

  if (supportCents > 0) {
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Heart & Hustle Support",
          description:
            "Optional contribution to maintain and improve the Heart & Hustle platform (not part of the team donation)",
        },
        unit_amount: supportCents,
      },
      quantity: 1,
    });
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items,
    success_url: `${base}/donate/${encodeURIComponent(b.token)}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/donate/${encodeURIComponent(b.token)}`,
    metadata: {
      athlete_id: b.athlete_id,
      fundraiser_id: b.fundraiser_id,
      donor_name: b.donor_name ?? "",
      donor_email: b.donor_email ?? "",
      donor_phone: b.donor_phone ?? "",
      anonymous: b.anonymous ? "true" : "false",
      fee_model: "keep_100",
      fee_payment_mode: feeMode,
      checkout_payment_method: paymentMethod,
      stated_donation_cents: String(statedCents),
      electronic_payment_fee_cents: String(epfCents),
      hh_support_cents: String(supportCents),
      org_allocation_cents: String(orgCents),
      total_charged_cents: String(totalCents),
      // amount_cents kept for older readers = org allocation (progress/payout)
      amount_cents: String(orgCents),
    },
  };

  if (paymentMethod === "us_bank_account") {
    sessionParams.payment_method_types = ["us_bank_account"];
    sessionParams.payment_method_options = {
      us_bank_account: {
        financial_connections: { permissions: ["payment_method"] },
      },
    };
  } else {
    sessionParams.payment_method_types = ["card"];
  }

  if (b.donor_email?.trim()) {
    sessionParams.customer_email = b.donor_email.trim();
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return NextResponse.json({ sessionId: session.id });
}
