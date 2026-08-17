"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { BRAND, MIN_DONATION_DOLLARS } from "@/lib/brand";
import {
  DONATE_MAJOR_TIERS,
  DONATE_QUICK_AMOUNTS,
} from "@/lib/donate-tiers";
import type { Athlete, Fundraiser } from "@heart-and-hustle/shared";
import {
  type CampaignDayBanner,
  type CampaignWindowPhase,
  type CheckoutPaymentMethod,
  type FeePaymentMode,
  campaignDonationsBlockedMessage,
  computeKeep100Checkout,
  effectiveAthleteGoalForDonorPage,
  formatDisplayDate,
  getDefaultDonorPageAboutText,
  normalizeFeeModel,
  suggestedHhSupportDollars,
} from "@heart-and-hustle/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { normalizePhoneDigits } from "@/lib/phone";
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

  // Keep 100% options (ignored for 90/10 fundraisers)
  const feeModel = normalizeFeeModel(fundraiser.fee_model);
  const isKeep100 = feeModel === "keep_100";
  const [coverFee, setCoverFee] = useState(true);
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("card");
  const [hhSupportOptIn, setHhSupportOptIn] = useState(true);
  const [hhSupportAmount, setHhSupportAmount] = useState(
    String(suggestedHhSupportDollars(50))
  );

  function scrollToDonateSection() {
    document
      .getElementById("donate-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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

  /** Single hero image: prefer team logo, then school. */
  const teamOrSchoolLogoUrl =
    fundraiser.team_logo_url?.trim() ||
    fundraiser.school_logo_url?.trim() ||
    null;

  function dollarsToCharge(): number {
    if (amountChoice === "other") {
      const v = parseFloat(customAmount);
      return Number.isFinite(v) ? v : NaN;
    }
    return amountChoice;
  }

  const statedDonation = dollarsToCharge();
  const keep100Preview =
    isKeep100 && Number.isFinite(statedDonation) && statedDonation > 0
      ? computeKeep100Checkout({
          statedDonation,
          feeMode: (coverFee
            ? "donor_covered"
            : "deducted_from_donation") as FeePaymentMode,
          paymentMethod,
          hhSupportDollars: hhSupportOptIn
            ? Number(hhSupportAmount) || suggestedHhSupportDollars(statedDonation)
            : 0,
        })
      : null;

  function onStatedAmountChosen(dollars: number) {
    setHhSupportAmount(String(suggestedHhSupportDollars(dollars)));
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
    const phoneDigits = normalizePhoneDigits(donorPhone);
    const phoneTen =
      phoneDigits.length === 11 && phoneDigits.startsWith("1")
        ? phoneDigits.slice(1)
        : phoneDigits;
    if (phoneTen.length !== 10) {
      setError("Enter a valid 10-digit U.S. mobile number.");
      return;
    }
    if (!stripePromise) {
      setError("Stripe is not configured (missing publishable key).");
      return;
    }

    setLoading(true);
    try {
      const feePaymentMode: FeePaymentMode = coverFee
        ? "donor_covered"
        : "deducted_from_donation";
      const supportDollars = hhSupportOptIn
        ? Math.max(0, Number(hhSupportAmount) || 0)
        : 0;
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountDollars: dollars,
          donor_name: anonymous ? null : donorName.trim(),
          donor_email: donorEmail.trim() || null,
          donor_phone: donorPhone.trim(),
          anonymous,
          athlete_id: athlete.id,
          fundraiser_id: fundraiser.id,
          token: athlete.unique_link_token,
          ...(isKeep100
            ? {
                feePaymentMode,
                paymentMethod,
                hhSupportDollars: supportDollars,
              }
            : {}),
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
              {teamOrSchoolLogoUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white/95">
                  <Image
                    src={teamOrSchoolLogoUrl}
                    alt=""
                    fill
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                  Support this participant
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <p className="min-w-0 flex-1 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200/80 sm:text-left">
                    {dayBanner.daysLeft === 1
                      ? "Last day to donate!"
                      : `${dayBanner.daysLeft} days left to donate`}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto shrink-0 border-emerald-700/30 bg-white px-4 py-3 font-semibold text-emerald-900 hover:bg-emerald-50"
                    onClick={scrollToDonateSection}
                  >
                    Donate now
                  </Button>
                </div>
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

        {/* Participant progress */}
        <section
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
          aria-labelledby="participant-progress"
        >
          <h2
            id="participant-progress"
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
                A personal goal will show here when set by the participant or Organizer.
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
          id="donate-section"
          className="scroll-mt-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
          aria-labelledby="choose-amount"
        >
          <h2
            id="choose-amount"
            className="text-sm font-semibold uppercase tracking-wide text-slate-500"
          >
            Donate now — choose an amount
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select a level or enter any amount ($
            {MIN_DONATION_DOLLARS} minimum).
          </p>

          <form className="mt-5 space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              {DONATE_MAJOR_TIERS.map((tier) => {
                const selected = amountChoice === tier.amount;
                return (
                  <button
                    key={tier.amount}
                    type="button"
                    onClick={() => {
                      setAmountChoice(tier.amount);
                      setCustomAmount("");
                      onStatedAmountChosen(tier.amount);
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
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Other amounts
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {DONATE_QUICK_AMOUNTS.map(({ amount, label }) => {
                  const selected = amountChoice === amount;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setAmountChoice(amount);
                        setCustomAmount("");
                        onStatedAmountChosen(amount);
                      }}
                      className={`shrink-0 rounded-lg border-2 px-3 py-2 text-sm font-bold tabular-nums transition ${
                        selected
                          ? "border-hh-primary bg-red-50/40 text-hh-dark ring-2 ring-hh-primary/20"
                          : "border-slate-200 bg-slate-50/80 text-slate-800 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setAmountChoice("other");
                    if (!customAmount) setCustomAmount("");
                  }}
                  className={`shrink-0 rounded-lg border-2 px-3 py-2 text-sm font-bold transition ${
                    amountChoice === "other"
                      ? "border-hh-primary bg-red-50/40 text-hh-dark ring-2 ring-hh-primary/20"
                      : "border-slate-200 bg-slate-50/80 text-slate-800 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  Custom
                </button>
                <div className="flex min-w-[7.5rem] flex-1 items-center gap-1 sm:max-w-[11rem]">
                  <span className="text-sm font-semibold text-slate-600">$</span>
                  <Input
                    type="number"
                    min={MIN_DONATION_DOLLARS}
                    step="1"
                    placeholder="Other"
                    value={amountChoice === "other" ? customAmount : ""}
                    onChange={(e) => {
                      setAmountChoice("other");
                      setCustomAmount(e.target.value);
                      const v = parseFloat(e.target.value);
                      if (Number.isFinite(v) && v > 0) onStatedAmountChosen(v);
                    }}
                    onFocus={() => setAmountChoice("other")}
                    className="h-9"
                    aria-label="Custom donation amount in dollars"
                  />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Tap Custom or enter any whole-dollar amount (minimum $
                {MIN_DONATION_DOLLARS}).
              </p>
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
                <Label htmlFor="dphone">Mobile phone</Label>
                <Input
                  id="dphone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="max-w-md"
                />
                <p className="text-xs leading-relaxed text-slate-600">
                  We use this only to match your gift to this fundraiser and stop
                  reminder texts after you donate. We never sell your number or use
                  it for marketing.
                </p>
              </div>
            </div>

            {isKeep100 && Number.isFinite(statedDonation) && statedDonation > 0 ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Keep 100% checkout
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    This program keeps the full stated donation when you cover
                    the Electronic Payment Fee. There is no 10% fundraising
                    commission.
                  </p>
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-hh-dark">
                    How will you pay?
                  </legend>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
                    <input
                      type="radio"
                      name="pay_method"
                      className="mt-1 accent-hh-primary"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                    />
                    <span className="text-sm text-slate-800">
                      <span className="font-semibold">Card</span>
                      <span className="mt-0.5 block text-slate-600">
                        Electronic Payment Fee: 3.9% + $0.30
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
                    <input
                      type="radio"
                      name="pay_method"
                      className="mt-1 accent-hh-primary"
                      checked={paymentMethod === "us_bank_account"}
                      onChange={() => setPaymentMethod("us_bank_account")}
                    />
                    <span className="text-sm text-slate-800">
                      <span className="font-semibold">Bank account (ACH)</span>
                      <span className="mt-0.5 block text-slate-600">
                        Electronic Payment Fee: 1%
                      </span>
                    </span>
                  </label>
                </fieldset>

                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3">
                  <Checkbox
                    id="cover_fee"
                    checked={coverFee}
                    onCheckedChange={(v: boolean | "indeterminate") =>
                      setCoverFee(v === true)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="cover_fee"
                    className="text-sm font-normal leading-snug text-slate-800"
                  >
                    <span className="font-semibold text-hh-dark">
                      Help our team receive the full amount
                    </span>{" "}
                    by covering the Electronic Payment Fee
                    {keep100Preview
                      ? ` ($${keep100Preview.electronicPaymentFee.toFixed(2)})`
                      : ""}
                    .
                    {!coverFee ? (
                      <span className="mt-1 block text-xs text-amber-900">
                        Fee will be deducted from your donation. The organization
                        receives $
                        {keep100Preview
                          ? keep100Preview.orgAllocation.toFixed(2)
                          : "—"}
                        .
                      </span>
                    ) : null}
                  </Label>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-hh-dark">
                      Support Heart &amp; Hustle
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Your contribution helps Heart &amp; Hustle maintain
                      and improve the fundraising platform for teams and programs.
                      This is separate from your donation to the organization.
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Suggested:{" "}
                      <strong>
                        5% ($
                        {Number.isFinite(statedDonation) && statedDonation > 0
                          ? suggestedHhSupportDollars(statedDonation).toFixed(2)
                          : suggestedHhSupportDollars(50).toFixed(2)}
                        )
                      </strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="hh_support"
                      checked={hhSupportOptIn}
                      onCheckedChange={(v: boolean | "indeterminate") => {
                        const on = v === true;
                        setHhSupportOptIn(on);
                        if (on) {
                          setHhSupportAmount(
                            String(suggestedHhSupportDollars(statedDonation))
                          );
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label
                        htmlFor="hh_support"
                        className="text-sm font-normal text-slate-800"
                      >
                        Include 5% support — uncheck to remove
                      </Label>
                      {hhSupportOptIn ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">
                            $
                          </span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={hhSupportAmount}
                            onChange={(e) => setHhSupportAmount(e.target.value)}
                            className="h-10 max-w-[8rem]"
                            aria-label="Heart and Hustle support amount"
                          />
                          <button
                            type="button"
                            className="text-xs font-medium text-hh-primary underline"
                            onClick={() =>
                              setHhSupportAmount(
                                String(suggestedHhSupportDollars(statedDonation))
                              )
                            }
                          >
                            Reset to 5%
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {keep100Preview ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                    <div className="flex justify-between gap-3 py-1">
                      <span>Donation to organization</span>
                      <span className="font-semibold tabular-nums">
                        ${keep100Preview.orgAllocation.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 py-1">
                      <span>Electronic Payment Fee</span>
                      <span className="tabular-nums">
                        {coverFee
                          ? `$${keep100Preview.electronicPaymentFee.toFixed(2)}`
                          : `$${keep100Preview.electronicPaymentFee.toFixed(2)} (from donation)`}
                      </span>
                    </div>
                    {keep100Preview.hhSupport > 0 ? (
                      <div className="flex justify-between gap-3 py-1">
                        <span>Heart &amp; Hustle Support</span>
                        <span className="tabular-nums">
                          ${keep100Preview.hhSupport.toFixed(2)}
                        </span>
                      </div>
                    ) : null}
                    <div className="mt-1 flex justify-between gap-3 border-t border-slate-100 pt-2 font-semibold">
                      <span>Total you pay</span>
                      <span className="tabular-nums text-hh-dark">
                        ${keep100Preview.totalCharged.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

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
                    if (isKeep100 && keep100Preview) {
                      return `Continue — pay $${keep100Preview.totalCharged.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }
                    const d = dollarsToCharge();
                    return Number.isFinite(d)
                      ? `Continue with $${d.toLocaleString()} donation`
                      : "Continue to secure checkout";
                  })()}
            </Button>
            <p className="mt-3 max-w-md text-center text-xs leading-relaxed text-slate-500 sm:text-left">
              Donor interactions on this page are governed by{" "}
              <Link
                href="/donor-terms"
                className="text-hh-primary underline underline-offset-2"
              >
                Donor terms
              </Link>{" "}
              and{" "}
              <Link
                href="/donor-privacy"
                className="text-hh-primary underline underline-offset-2"
              >
                Donor privacy policy
              </Link>
              . Tax treatment depends on the receiving organization and your own
              circumstances. Consult your tax advisor.
            </p>
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
            Overall progress toward the program&apos;s team goal — every participant
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
