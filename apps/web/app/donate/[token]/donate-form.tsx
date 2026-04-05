"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { BRAND, MIN_DONATION_DOLLARS } from "@/lib/brand";
import { DONATE_TIERS } from "@/lib/donate-tiers";
import type { Athlete, Fundraiser } from "@heart-and-hustle/shared";
import {
  type CampaignDayBanner,
  type CampaignWindowPhase,
  campaignDonationsBlockedMessage,
  effectiveAthleteGoalForDonorPage,
  formatDisplayDate,
  getDefaultDonorPageAboutText,
} from "@heart-and-hustle/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DonateShareRow } from "./donate-share-row";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function ProgressBlock({
  label,
  raised,
  goal,
  pct,
  barClass,
}: {
  label: string;
  raised: number;
  goal: number | null;
  pct: number | null;
  barClass: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {goal != null && goal > 0 ? (
          <span className="text-sm tabular-nums text-slate-700">
            <span className="font-semibold text-hh-dark">
              ${raised.toFixed(2)}
            </span>
            <span className="text-slate-500"> / ${goal.toFixed(2)}</span>
            {pct != null ? (
              <span className="ml-2 text-slate-500">{pct.toFixed(0)}%</span>
            ) : null}
          </span>
        ) : (
          <span className="text-sm font-semibold tabular-nums text-hh-dark">
            ${raised.toFixed(2)} raised
          </span>
        )}
      </div>
      {goal != null && goal > 0 ? (
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90">
          <div
            className={`h-full rounded-full transition-all ${barClass}`}
            style={{ width: `${Math.min(100, pct ?? 0)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  athlete: Athlete;
  fundraiser: Fundraiser;
  campaignPhase: CampaignWindowPhase;
  dayBanner: CampaignDayBanner | null;
  donatePageUrl: string;
  teamRaised: number;
  athleteRaised: number;
};

export default function DonateForm({
  athlete,
  fundraiser,
  campaignPhase,
  dayBanner,
  donatePageUrl,
  teamRaised,
  athleteRaised,
}: Props) {
  const [amountChoice, setAmountChoice] = useState<number | "other">(50);
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

  const athleteGoal = effectiveAthleteGoalForDonorPage(athlete, fundraiser);
  const athletePct =
    athleteGoal != null && athleteGoal > 0
      ? Math.min(100, (athleteRaised / athleteGoal) * 100)
      : null;

  const aboutText =
    fundraiser.donor_page_about?.trim() ||
    getDefaultDonorPageAboutText(
      fundraiser.team_name,
      fundraiser.school_name,
      athlete.full_name
    );

  function dollarsToCharge(): number {
    if (amountChoice === "other") {
      const v = parseFloat(customAmount);
      return Number.isFinite(v) ? v : NaN;
    }
    return amountChoice;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (campaignPhase !== "active") {
      setError(
        campaignDonationsBlockedMessage(
          campaignPhase,
          fundraiser.start_date,
          fundraiser.end_date
        )
      );
      return;
    }
    const dollars = dollarsToCharge();
    if (!Number.isFinite(dollars) || dollars < MIN_DONATION_DOLLARS) {
      setError(`Enter at least $${MIN_DONATION_DOLLARS} or pick an amount above.`);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 px-4 py-8 pb-16 sm:py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-hh-primary hover:underline"
        >
          ← {BRAND.name}
        </Link>

        {/* Hero */}
        <header className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-900/5">
          <div className="border-b border-slate-100 bg-gradient-to-br from-hh-dark via-[#252540] to-slate-900 px-5 py-6 text-white">
            <div className="flex items-start gap-4">
              <div className="flex shrink-0 gap-2">
                {fundraiser.school_logo_url ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/20 bg-white/95">
                    <Image
                      src={fundraiser.school_logo_url}
                      alt=""
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  </div>
                ) : null}
                {fundraiser.team_logo_url ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/20 bg-white/95">
                    <Image
                      src={fundraiser.team_logo_url}
                      alt=""
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  </div>
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                  Support a student-athlete
                </p>
                <h1 className="mt-1 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                  {athlete.full_name}
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  {fundraiser.team_name} · {fundraiser.school_name}
                </p>
                <p className="mt-2 text-xs text-white/55">
                  Campaign {formatDisplayDate(fundraiser.start_date)} –{" "}
                  {formatDisplayDate(fundraiser.end_date)} · Central Time
                </p>
              </div>
            </div>
          </div>

          {dayBanner ? (
            <div className="px-5 py-3">
              {dayBanner.phase === "active" ? (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200/80">
                  {dayBanner.daysLeft === 1
                    ? "Last day to donate!"
                    : `${dayBanner.daysLeft} days left to donate`}
                </p>
              ) : dayBanner.phase === "before_start" ? (
                <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-800 ring-1 ring-slate-200">
                  {dayBanner.daysUntilStart === 0
                    ? "Campaign starts today."
                    : dayBanner.daysUntilStart === 1
                      ? "Campaign starts tomorrow."
                      : `Campaign starts in ${dayBanner.daysUntilStart} days.`}
                </p>
              ) : (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-950 ring-1 ring-amber-200">
                  This campaign has ended. Thank you for your support.
                </p>
              )}
            </div>
          ) : null}
        </header>

        {campaignPhase !== "active" ? (
          <div
            className="rounded-2xl border border-amber-300/90 bg-amber-50 px-5 py-4 text-sm text-amber-950 shadow-sm"
            role="status"
          >
            {campaignDonationsBlockedMessage(
              campaignPhase,
              fundraiser.start_date,
              fundraiser.end_date
            )}
          </div>
        ) : null}

        {/* About */}
        <section
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
          aria-labelledby="about-fundraiser"
        >
          <h2
            id="about-fundraiser"
            className="text-sm font-semibold uppercase tracking-wide text-slate-500"
          >
            About this fundraiser
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
            {aboutText}
          </p>
        </section>

        {/* Athlete progress */}
        <section
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
          aria-labelledby="athlete-progress"
        >
          <h2
            id="athlete-progress"
            className="text-sm font-semibold uppercase tracking-wide text-slate-500"
          >
            {athlete.full_name}&apos;s progress
          </h2>
          <div className="mt-4">
            <ProgressBlock
              label="Personal fundraising"
              raised={athleteRaised}
              goal={athleteGoal}
              pct={athletePct}
              barClass="bg-gradient-to-r from-amber-500 to-hh-accent"
            />
            {athleteGoal == null ? (
              <p className="mt-2 text-xs text-slate-500">
                A personal goal will show here when set by the athlete or coach.
              </p>
            ) : null}
          </div>
        </section>

        <DonateShareRow
          shareUrl={donatePageUrl}
          athleteName={athlete.full_name}
          teamName={fundraiser.team_name}
          schoolName={fundraiser.school_name}
        />

        {/* Donation */}
        <section
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
          aria-labelledby="choose-amount"
        >
          <h2
            id="choose-amount"
            className="text-sm font-semibold uppercase tracking-wide text-slate-500"
          >
            Choose an amount
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select a level or enter any amount ($
            {MIN_DONATION_DOLLARS} minimum).
          </p>

          <form className="mt-5 space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              {DONATE_TIERS.map((tier) => {
                const selected = amountChoice === tier.amount;
                return (
                  <button
                    key={tier.amount}
                    type="button"
                    onClick={() => {
                      setAmountChoice(tier.amount);
                      setCustomAmount("");
                    }}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      selected
                        ? "border-hh-primary bg-red-50/40 ring-2 ring-hh-primary/20"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <p className="text-lg font-bold text-hh-dark">
                      {tier.title}
                    </p>
                    <p className="mt-0.5 text-2xl font-black tabular-nums text-hh-primary">
                      ${tier.amount.toLocaleString()}
                    </p>
                    {tier.subtitle ? (
                      <p className="mt-2 text-xs leading-snug text-slate-600">
                        {tier.subtitle}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setAmountChoice("other")}
                className={`w-full rounded-xl border-2 p-4 text-left transition sm:max-w-md ${
                  amountChoice === "other"
                    ? "border-hh-primary bg-red-50/40 ring-2 ring-hh-primary/20"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                }`}
              >
                <span className="font-bold text-hh-dark">Custom amount</span>
                <span className="mt-1 block text-sm text-slate-600">
                  Enter any whole-dollar amount you prefer.
                </span>
              </button>
              {amountChoice === "other" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:max-w-md">
                  <span className="text-sm font-medium text-slate-600">$</span>
                  <Input
                    type="number"
                    min={MIN_DONATION_DOLLARS}
                    step="1"
                    placeholder="Amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="max-w-[10rem]"
                  />
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="anon"
                  checked={anonymous}
                  onCheckedChange={(v: boolean | "indeterminate") =>
                    setAnonymous(v === true)
                  }
                />
                <Label htmlFor="anon" className="font-normal text-slate-700">
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
                    className="max-w-md"
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
                  className="max-w-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dphone">Phone (optional)</Label>
                <Input
                  id="dphone"
                  type="tel"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="max-w-md"
                />
                <p className="text-xs text-slate-500">
                  If it matches a contact the athlete texted, we may mark them as
                  donated for reminder lists.
                </p>
              </div>
            </div>

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="h-12 w-full text-base font-semibold shadow-md sm:max-w-md"
              size="lg"
              disabled={loading || campaignPhase !== "active"}
            >
              {loading
                ? "Redirecting to secure checkout…"
                : (() => {
                    const d = dollarsToCharge();
                    return Number.isFinite(d)
                      ? `Continue with $${d.toLocaleString()} donation`
                      : "Continue to secure checkout";
                  })()}
            </Button>
          </form>
        </section>

        {/* Team campaign — bottom */}
        <section
          className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 p-5 shadow-md sm:p-6"
          aria-labelledby="team-campaign"
        >
          <h2
            id="team-campaign"
            className="text-sm font-semibold uppercase tracking-wide text-slate-500"
          >
            Full team campaign
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Overall progress toward the program&apos;s team goal — every athlete
            contributes to this total.
          </p>
          <div className="mt-5">
            <ProgressBlock
              label="Team goal"
              raised={teamRaised}
              goal={teamGoal > 0 ? teamGoal : null}
              pct={teamGoal > 0 ? teamPct : null}
              barClass="bg-gradient-to-r from-hh-primary to-red-600"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
