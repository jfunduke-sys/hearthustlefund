"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Fundraiser,
  FundraiserStripeFinancialBreakdown,
  SchoolRequest,
} from "@heart-and-hustle/shared";
import {
  formatDisplayDate,
  formatKickoffSetupPreference,
  schoolRequestLeadDisplayName,
} from "@heart-and-hustle/shared";
import type { FundraiserAnalytics } from "@/lib/admin-fundraiser-analytics";
import {
  setFundraiserStatus,
  updateFundraiserComplianceNotes,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  fundraiser: Fundraiser;
  coachEmail: string | null;
  analytics: FundraiserAnalytics;
  stripeBreakdown: FundraiserStripeFinancialBreakdown;
  schoolRequest: SchoolRequest | null;
  complianceNotes: string | null;
};

export function FundraiserDetailClient({
  fundraiser,
  coachEmail,
  analytics,
  stripeBreakdown,
  schoolRequest,
  complianceNotes: initialNotes,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initialNotes ?? "");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/admin">← SuperAdmin</Link>
        </Button>
        {coachEmail ? (
          <Button variant="secondary" asChild>
            <a href={`mailto:${coachEmail}`}>Email coach</a>
          </Button>
        ) : null}
        <Button variant="outline" asChild>
          <Link href="/coach/login" target="_blank" rel="noreferrer">
            Coach login (opens new tab)
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/join/${fundraiser.unique_slug}`} target="_blank" rel="noreferrer">
            Public team join page
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-hh-dark">
          {fundraiser.school_name} · {fundraiser.team_name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Status: <strong>{fundraiser.status}</strong>
          {fundraiser.join_code ? (
            <>
              {" "}
              · Team join code:{" "}
              <span className="font-mono">{fundraiser.join_code}</span>
            </>
          ) : null}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Coaches manage the live campaign in{" "}
          <strong>Coach login</strong> using{" "}
          {coachEmail ?? "their registered email"}
          . You cannot open their session from here; use this page to review
          data and internal notes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Participants (athletes)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.participantCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Gross raised</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${analytics.grossRaised.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Donations (count)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.donationCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg donation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${analytics.avgDonation.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg raised / athlete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${analytics.avgRaisedPerAthlete.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Texts sent (logged)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.textsSent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conversion (donations ÷ texts)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.conversionPercent != null
                ? `${analytics.conversionPercent.toFixed(1)}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-hh-primary/20">
        <CardHeader>
          <CardTitle>Payments &amp; Stripe fees</CardTitle>
          <p className="text-sm font-normal text-slate-600">
            SuperAdmin-only view of donation totals vs Stripe processing fees.
            Does not include your team&apos;s time or other operating costs.
            Refunds and disputes may change final settlement—confirm in{" "}
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noreferrer"
              className="text-hh-primary underline"
            >
              Stripe
            </a>
            .
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-800">
          {!stripeBreakdown.stripeConfigured ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              Set <span className="font-mono">STRIPE_SECRET_KEY</span> on the
              server to load live fees from Stripe. Gross below still matches
              recorded donations; fee and net lines use only fees already stored
              on each donation (new checkouts save fees automatically).
            </p>
          ) : null}
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-slate-600">Donations (count)</dt>
              <dd className="text-lg font-semibold text-hh-dark">
                {stripeBreakdown.donationCount}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Gross donations</dt>
              <dd className="text-lg font-semibold text-hh-dark">
                ${stripeBreakdown.grossDollars.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Stripe processing fees (known)</dt>
              <dd className="text-lg font-semibold text-hh-dark">
                ${stripeBreakdown.stripeFeesDollars.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">
                {stripeBreakdown.unresolvedCount > 0
                  ? "Net (after known fees only)"
                  : "Net after Stripe fees"}
              </dt>
              <dd className="text-lg font-semibold text-emerald-800">
                ${stripeBreakdown.netAfterStripeFeesDollars.toFixed(2)}
              </dd>
            </div>
          </dl>
          {stripeBreakdown.effectiveFeePercentOfGross != null ? (
            <p className="text-slate-600">
              Effective Stripe fee rate (of gross):{" "}
              <strong>
                {stripeBreakdown.effectiveFeePercentOfGross.toFixed(2)}%
              </strong>
            </p>
          ) : stripeBreakdown.donationCount > 0 ? (
            <p className="text-slate-600">
              Effective fee % is shown once every donation has a resolved Stripe
              fee.
            </p>
          ) : null}
          {!stripeBreakdown.stripeConfigured &&
          stripeBreakdown.donationCount > 0 &&
          stripeBreakdown.resolvedFeeCount === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              No Stripe fees are stored on these donations yet. The net figure
              equals gross until you configure{" "}
              <span className="font-mono">STRIPE_SECRET_KEY</span> and reload
              this page (fees are then fetched and saved per payment).
            </p>
          ) : null}
          {stripeBreakdown.stripeConfigured &&
          stripeBreakdown.unresolvedCount > 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              {stripeBreakdown.unresolvedCount} payment
              {stripeBreakdown.unresolvedCount === 1 ? "" : "s"} with unknown
              fees (e.g. legacy checkout id). True net is lower than the figure
              above. Fees are saved automatically when resolved—refresh this
              page after fixing data, or check Stripe by payment ID.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {schoolRequest ? (
        <Card>
          <CardHeader>
            <CardTitle>Original school request (intake)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-slate-700">
            <p>
              <strong>District:</strong> {schoolRequest.school_district}
            </p>
            <p>
              <strong>Address:</strong> {schoolRequest.school_address}
            </p>
            <p>
              <strong>Activity:</strong>{" "}
              {schoolRequest.sport_club_activity ?? "—"}
            </p>
            <p>
              <strong>Lead:</strong>{" "}
              {schoolRequestLeadDisplayName(schoolRequest)} ·{" "}
              {schoolRequest.admin_phone}
            </p>
            <p>
              <strong>Proposed dates (intake):</strong>{" "}
              {formatDisplayDate(schoolRequest.fundraiser_start_date)} –{" "}
              {formatDisplayDate(schoolRequest.fundraiser_end_date)}
            </p>
            <p>
              <strong>Kickoff (intake):</strong>{" "}
              {formatKickoffSetupPreference(
                schoolRequest.kickoff_setup_preference
              )}
            </p>
            {schoolRequest.notes ? (
              <p className="mt-2 border-t border-slate-200 pt-2">
                <strong>Request notes:</strong> {schoolRequest.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Legal / tax & internal compliance</CardTitle>
          <p className="text-sm font-normal text-slate-600">
            Store internal references only. This is not legal advice — consult
            counsel for filing obligations. Retain official records per your
            retention policy.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="compliance">Admin notes (private)</Label>
            <Textarea
              id="compliance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Record IDs, filing references, or internal coordination notes…"
            />
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await updateFundraiserComplianceNotes(fundraiser.id, notes);
                router.refresh();
              })
            }
          >
            Save notes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fundraiser status</CardTitle>
          <p className="text-sm font-normal text-slate-600">
            Mark completed when the campaign ends successfully, or cancelled if it
            did not run. Reactivate only if you need to correct a mistake.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={pending || fundraiser.status === "active"}
            onClick={() =>
              startTransition(async () => {
                await setFundraiserStatus(fundraiser.id, "active");
                router.refresh();
              })
            }
          >
            Set active
          </Button>
          <Button
            disabled={pending || fundraiser.status === "completed"}
            onClick={() =>
              startTransition(async () => {
                await setFundraiserStatus(fundraiser.id, "completed");
                router.refresh();
              })
            }
          >
            Mark completed
          </Button>
          <Button
            variant="secondary"
            disabled={pending || fundraiser.status === "cancelled"}
            onClick={() =>
              startTransition(async () => {
                await setFundraiserStatus(fundraiser.id, "cancelled");
                router.refresh();
              })
            }
          >
            Mark cancelled
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
