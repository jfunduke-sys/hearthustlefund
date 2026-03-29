"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCoachShowOnTeamRoster } from "@/app/actions/coach";
import { type Athlete, type Fundraiser } from "@heart-and-hustle/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  fundraiser: Fundraiser;
  coachAthlete: Athlete | null;
  baseUrl: string;
};

export default function CoachParticipantCard({
  fundraiser,
  coachAthlete,
  baseUrl,
}: Props) {
  const router = useRouter();
  const [rosterPending, startRosterTransition] = useTransition();
  const [showOnTeamRoster, setShowOnTeamRoster] = useState(
    () => coachAthlete?.show_on_team_roster ?? true
  );
  const [status, setStatus] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!coachAthlete) return;
    setShowOnTeamRoster(coachAthlete.show_on_team_roster ?? true);
  }, [coachAthlete, coachAthlete?.id, coachAthlete?.show_on_team_roster]);

  const donateLink = coachAthlete
    ? `${baseUrl.replace(/\/$/, "")}/donate/${coachAthlete.unique_link_token}`
    : "";

  function onTeamRosterChecked(checked: boolean) {
    if (!coachAthlete) return;
    setShowOnTeamRoster(checked);
    startRosterTransition(async () => {
      try {
        await setCoachShowOnTeamRoster({
          athleteId: coachAthlete.id,
          fundraiserId: fundraiser.id,
          showOnTeamRoster: checked,
        });
        router.refresh();
      } catch (err: unknown) {
        setShowOnTeamRoster(!checked);
        setStatus(
          err instanceof Error ? err.message : "Could not update roster visibility."
        );
      }
    });
  }

  async function copyDonateLink() {
    setStatus(null);
    await navigator.clipboard.writeText(donateLink);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  }

  if (!coachAthlete) {
    return (
      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader>
          <CardTitle className="text-hh-dark">Your Participation</CardTitle>
          <CardDescription>
            Your participant record is created automatically from your coach
            account so you can use the mobile app with the same email and
            password—no extra signup form. If this card doesn&apos;t load after
            a moment, refresh the page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="secondary" onClick={() => router.refresh()}>
            Refresh dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-hh-dark">Your Participation</CardTitle>
        <CardDescription>
          This is your <strong>personal donation link</strong>—the same kind
          athletes get. Donations made here count toward your own goal on this
          campaign. Copy it and paste into an email (or anywhere else) from your
          computer. To text contacts from your phone, use the mobile app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Personal donation link
          </p>
          <p className="break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
            {donateLink}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copyDonateLink()}
          >
            {linkCopied ? "Copied!" : "Copy link for email"}
          </Button>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
          <Checkbox
            id="coach-show-on-roster"
            checked={showOnTeamRoster}
            disabled={rosterPending}
            onCheckedChange={(v: boolean | "indeterminate") =>
              onTeamRosterChecked(v === true)
            }
            aria-labelledby="coach-show-on-roster-label"
          />
          <div className="min-w-0 space-y-1">
            <Label
              id="coach-show-on-roster-label"
              htmlFor="coach-show-on-roster"
              className="cursor-pointer text-sm font-semibold text-hh-dark"
            >
              Show my name on the team participant list in the app
            </Label>
            <p className="text-xs leading-relaxed text-slate-600">
              Athletes see this list on their mobile dashboard. Off by default for
              coaches—turn it on if you want to appear next to your players. You
              can still use the app either way.
            </p>
          </div>
        </div>

        {status ? (
          <p className="text-sm text-slate-600" role="status">
            {status}
          </p>
        ) : null}

        <p className="text-xs text-slate-500">
          Sign in to the mobile app with the same coach email and password as
          this site to send fundraising texts—you do not need the team join
          code.
        </p>
      </CardContent>
    </Card>
  );
}
