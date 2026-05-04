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
import type {
  FundraiserAnalytics,
  RevenueSplitSnapshot,
} from "@/lib/admin-fundraiser-analytics";
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
  revenueSplit: RevenueSplitSnapshot;
  stripeBreakdown: FundraiserStripeFinancialBreakdown;
  schoolRequest: SchoolRequest | null;
  complianceNotes: string | null;
};

export function FundraiserDetailClient({
  fundraiser,
  coachEmail,
  analytics,
  revenueSplit,
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
            <a href={`mailto:${coachEmail}`}>Email Organizer</a>
          </Button>
        ) : null}
        <Button variant="outline" asChild>
          <Link href="/coach/login" target="_blank" rel="noreferrer">
            Organizer login (opens new tab)
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
        {fundraiser.uses_campaign_groups ? (
          <p className="mt-2 text-sm font-medium text-amber-900">
            Teams / groups: enabled for this campaign (group setup and group
            manager app flows in progress). The Lead Organizer can turn this off on
            their dashboard, which deletes all group configuration.
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">
          Organizers manage the live campaign in{" "}
          <strong>Organizer login</strong> using{" "}
          {coachEmail ?? "their registered email"}
          . You cannot open their session from here; use this page to review
          data and internal notes.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{analytics.participantCount}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Engagement &amp; donation activity</CardTitle>
          <p className="text-sm font-normal text-slate-600">
            Same metrics as the SuperAdmin closed-fundraiser list (now shown only
            here per campaign). Conversion uses donations ÷ texts sent when texts
            are logged.
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-600">Donations (count)</dt>
              <dd className="text-xl font-semibold tabular-nums text-hh-dark">
                {analytics.donationCount}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Texts sent (logged)</dt>
              <dd className="text-xl font-semibold tabular-nums text-hh-dark">
                {analytics.textsSent}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Conversion (donations ÷ texts)</dt>
              <dd className="text-xl font-semibold tabular-nums text-hh-dark">
                {analytics.conversionPercent != null
                  ? `${analytics.conversionPercent.toFixed(1)}%`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Avg donation</dt>
              <dd className="text-xl font-semibold tabular-nums text-hh-dark">
                ${analytics.avgDonation.toFixed(2)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-600">Avg raised / participant</dt>
              <dd className="text-xl font-semibold tabular-nums text-hh-dark">
                ${analytics.avgRaisedPerAthlete.toFixed(2)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="border-hh-primary/20">
        <CardHeader>
          <CardTitle>Campaign revenue (90% / 10%)</CardTitle>
          <p className="text-sm font-normal text-slate-600">
            Four-line summary matching the SuperAdmin closed fundraisers table.
            Stripe fees in net revenue are the sum of known{" "}
            <span className="font-mono">stripe_fee_cents</span> on donations only.
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-700">
                Total gross of campaign
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-hh-dark">
                ${analytics.grossRaised.toFixed(2)}
              </dd>
              <p className="mt-1 text-xs text-slate-500">
                Sum of recorded donation amounts (see Payments below).
              </p>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-700">
                Program cut (90% of gross)
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-hh-dark">
                ${revenueSplit.programCut.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-700">
                H&amp;H cut (10% of gross)
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-hh-dark">
                ${revenueSplit.hhCut.toFixed(2)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-700">
                Net revenue (H&amp;H&apos;s 10% cut minus Stripe fees)
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-emerald-800">
                ${revenueSplit.netHhRevenue.toFixed(2)}
              </dd>
              <p className="mt-1 text-xs text-slate-500">
                Stripe fees deducted here: ${revenueSplit.stripeFeesDollars.toFixed(2)}{" "}
                (known fees only).
              </p>
            </div>
          </dl>
          {revenueSplit.donationsWithUnknownFee > 0 ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {revenueSplit.donationsWithUnknownFee} donation
              {revenueSplit.donationsWithUnknownFee === 1 ? "" : "s"} with no
              stored Stripe fee — net revenue is understated until resolved (see
              Payments section below).
            </p>
          ) : null}
        </CardContent>
      </Card>

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
                  : "Gross minus Stripe fees (full amount)"}
              </dt>
              <dd className="text-lg font-semibold text-emerald-800">
                ${stripeBreakdown.netAfterStripeFeesDollars.toFixed(2)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-slate-500">
            This line is total gross less processing fees—not the 90% program /
            10% platform split. Use{" "}
            <strong className="font-semibold text-slate-600">Net revenue</strong>{" "}
            in the campaign revenue card for H&amp;H&apos;s 10% after Stripe.
          </p>
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
            Use closeout when payout and reconciliation are complete. Closeout
            (completed/cancelled) removes participant campaign app access for this
            fundraiser while retaining required legal and financial records.
            Reactivate only if you need to correct a mistake.
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
            Closeout: Completed
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
            Closeout: Cancelled
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
