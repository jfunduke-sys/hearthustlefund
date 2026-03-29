"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Fundraiser, SchoolRequest } from "@heart-and-hustle/shared";
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
  schoolRequest: SchoolRequest | null;
  complianceNotes: string | null;
};

export function FundraiserDetailClient({
  fundraiser,
  coachEmail,
  analytics,
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
              <strong>Lead:</strong> {schoolRequest.admin_name} ·{" "}
              {schoolRequest.admin_phone}
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
