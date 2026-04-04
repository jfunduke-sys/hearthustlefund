import Link from "next/link";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND } from "@/lib/brand";
import { recordDonationFromCheckoutSession } from "@/lib/record-donation-from-checkout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThankYouShareSection } from "./thank-you-share";

type Props = {
  params: { token: string };
  searchParams: { session_id?: string };
};

export default async function ThankYouPage({ params, searchParams }: Props) {
  const sessionId = searchParams.session_id;
  let amount: number | null = null;
  let athleteName: string | null = null;

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.amount_total != null) {
        amount = session.amount_total / 100;
      }
      const aid = session.metadata?.athlete_id;
      if (aid) {
        const admin = createAdminClient();
        const { data: a } = await admin
          .from("athletes")
          .select("full_name")
          .eq("id", aid)
          .maybeSingle();
        athleteName = a?.full_name ?? null;
      }
      /* Record donation when webhooks cannot reach this host (e.g. localhost). Idempotent with webhook. */
      const recorded = await recordDonationFromCheckoutSession(session, stripe);
      if (recorded.error) {
        console.error("[thank-you] donation sync", recorded.error);
      }
    } catch {
      /* ignore */
    }
  }

  const shareUrl =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string"
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/donate/${params.token}`
      : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md border-hh-dark/10">
        <CardHeader>
          <CardTitle className="text-hh-dark">Thank you!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          <p>
            {athleteName
              ? `Thank you for supporting ${athleteName}.`
              : "Thank you for your support."}
          </p>
          {amount != null ? (
            <p className="text-lg font-semibold text-hh-dark">
              ${amount.toFixed(2)}
            </p>
          ) : null}
          {shareUrl ? (
            <ThankYouShareSection
              shareUrl={shareUrl}
              athleteName={athleteName}
            />
          ) : null}
          <Link href="/" className="inline-block text-hh-primary hover:underline">
            ← {BRAND.name}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
