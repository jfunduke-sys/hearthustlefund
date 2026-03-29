"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { BRAND, DONATION_PRESETS, MIN_DONATION_DOLLARS } from "@/lib/brand";
import type { Athlete, Fundraiser } from "@heart-and-hustle/shared";
import { formatDisplayDate } from "@heart-and-hustle/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type Props = {
  athlete: Athlete;
  fundraiser: Fundraiser;
  teamRaised: number;
  athleteRaised: number;
};

export default function DonateForm({
  athlete,
  fundraiser,
  teamRaised,
  athleteRaised,
}: Props) {
  const [amountChoice, setAmountChoice] = useState<number | "other" | null>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamGoal = Number(fundraiser.total_goal);
  const teamPct =
    teamGoal > 0 ? Math.min(100, (teamRaised / teamGoal) * 100) : 0;
  const personalGoal = athlete.personal_goal
    ? Number(athlete.personal_goal)
    : null;
  const athletePct =
    personalGoal && personalGoal > 0
      ? Math.min(100, (athleteRaised / personalGoal) * 100)
      : null;

  function dollarsToCharge(): number {
    if (amountChoice === "other") {
      const v = parseFloat(customAmount);
      return Number.isFinite(v) ? v : NaN;
    }
    if (typeof amountChoice === "number") return amountChoice;
    return NaN;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dollars = dollarsToCharge();
    if (!Number.isFinite(dollars) || dollars < MIN_DONATION_DOLLARS) {
      setError(`Minimum donation is $${MIN_DONATION_DOLLARS}.`);
      return;
    }
    if (!anonymous && !donorName.trim()) {
      setError("Enter your name or choose anonymous.");
      return;
    }
    if (!stripePromise) {
      setError("Stripe is not configured (missing publishable key).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountDollars: dollars,
          donor_name: anonymous ? null : donorName.trim(),
          donor_email: donorEmail.trim() || null,
          donor_phone: donorPhone.trim() || null,
          anonymous,
          athlete_id: athlete.id,
          fundraiser_id: fundraiser.id,
          token: athlete.unique_link_token,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Checkout failed");
      const stripe = await stripePromise;
      if (!stripe || !body.sessionId) throw new Error("Stripe unavailable");
      const { error: stripeErr } = await stripe.redirectToCheckout({
        sessionId: body.sessionId,
      });
      if (stripeErr) throw stripeErr;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm text-hh-primary hover:underline">
          ← {BRAND.name}
        </Link>

        <Card className="mt-6 border-hh-dark/10">
          <CardHeader className="space-y-4">
            <div className="flex items-start gap-4">
              {fundraiser.school_logo_url ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-white">
                  <Image
                    src={fundraiser.school_logo_url}
                    alt="School"
                    fill
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>
              ) : null}
              <div>
                <CardTitle className="text-hh-dark">
                  You&apos;re supporting {athlete.full_name}!
                </CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  {fundraiser.team_name} · {fundraiser.school_name}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Campaign ends {formatDisplayDate(fundraiser.end_date)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Team progress
              </p>
              <div className="mt-1 flex justify-between text-sm">
                <span>
                  ${teamRaised.toFixed(2)} / ${teamGoal.toFixed(2)}
                </span>
                <span>{teamPct.toFixed(0)}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-hh-primary"
                  style={{ width: `${teamPct}%` }}
                />
              </div>
            </div>

            {personalGoal ? (
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  {athlete.full_name}&apos;s goal
                </p>
                <div className="mt-1 flex justify-between text-sm">
                  <span>
                    ${athleteRaised.toFixed(2)} / ${personalGoal.toFixed(2)}
                  </span>
                  <span>{athletePct != null ? `${athletePct.toFixed(0)}%` : ""}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-hh-accent"
                    style={{ width: `${athletePct ?? 0}%` }}
                  />
                </div>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <Label>Amount</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DONATION_PRESETS.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={amountChoice === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmountChoice(n)}
                    >
                      ${n}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={amountChoice === "other" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmountChoice("other")}
                  >
                    Other
                  </Button>
                </div>
                {amountChoice === "other" ? (
                  <Input
                    className="mt-2"
                    type="number"
                    min={MIN_DONATION_DOLLARS}
                    step="1"
                    placeholder="Custom amount (USD)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="anon"
                  checked={anonymous}
                  onCheckedChange={(v: boolean | "indeterminate") =>
                    setAnonymous(v === true)
                  }
                />
                <Label htmlFor="anon" className="font-normal">
                  Donate anonymously
                </Label>
              </div>
              {!anonymous ? (
                <div className="space-y-2">
                  <Label htmlFor="dname">Full name</Label>
                  <Input
                    id="dname"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="demail">
                  Email (optional — for Stripe receipt)
                </Label>
                <Input
                  id="demail"
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Stripe can email an automatic receipt to this address when
                  enabled in your Stripe Dashboard.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dphone">Phone (optional)</Label>
                <Input
                  id="dphone"
                  type="tel"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  If provided, we may mark matching contacts as donated for
                  reminder flows.
                </p>
              </div>

              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Redirecting…" : "Donate now ❤"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
