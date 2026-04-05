import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_DONATION_DOLLARS } from "@/lib/brand";
import { isCampaignWindowActiveForDonations } from "@heart-and-hustle/shared";

const bodySchema = z.object({
  amountDollars: z.number().min(MIN_DONATION_DOLLARS),
  donor_name: z.string().nullable(),
  donor_email: z.string().nullable(),
  donor_phone: z.string().nullable(),
  anonymous: z.boolean(),
  athlete_id: z.string().uuid(),
  fundraiser_id: z.string().uuid(),
  token: z.string().min(8),
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
    .select("id, status, start_date, end_date")
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
    },
  });

  return NextResponse.json({ sessionId: session.id });
}
