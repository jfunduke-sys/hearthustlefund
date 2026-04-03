"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/brand";
import type { Athlete, Donation, Fundraiser } from "@heart-and-hustle/shared";
import {
  PLATFORM,
  formatDisplayDate,
  formatDisplayDateTime,
} from "@heart-and-hustle/shared";
import CoachParticipantCard from "./coach-participant-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  fundraiser: Fundraiser;
  coachAthlete: Athlete | null;
  athletes: Athlete[];
  donations: Donation[];
  textsByAthlete: Record<string, number>;
  donationsByAthlete: Record<string, number>;
  raisedByAthlete: Record<string, number>;
};

/** Campaign-level per-athlete target from setup (not athlete-specific overrides). */
function fundraiserImpliedPerAthleteGoal(fr: Fundraiser): number | null {
  const gpa =
    fr.goal_per_athlete != null ? Number(fr.goal_per_athlete) : NaN;
  if (Number.isFinite(gpa) && gpa > 0) return gpa;
  const exp = fr.expected_participants;
  const total = Number(fr.total_goal);
  if (exp != null && exp > 0 && Number.isFinite(total) && total > 0) {
    return total / exp;
  }
  return null;
}

/**
 * Amount we use for "personal goal" and % columns: athlete row if set, else
 * campaign default (goal_per_athlete, else total_goal ÷ expected_participants).
 */
function effectivePersonalGoal(athlete: Athlete, fr: Fundraiser): number | null {
  const pg =
    athlete.personal_goal != null ? Number(athlete.personal_goal) : NaN;
  if (Number.isFinite(pg) && pg > 0) return pg;
  return fundraiserImpliedPerAthleteGoal(fr);
}

export default function CoachDashboardClient({
  fundraiser,
  coachAthlete,
  athletes,
  donations,
  textsByAthlete,
  donationsByAthlete,
  raisedByAthlete,
}: Props) {
  const router = useRouter();
  const [inviteCopied, setInviteCopied] = useState(false);
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  const totalRaised = donations.reduce(
    (s, d) => s + Number(d.amount),
    0
  );
  const goal = Number(fundraiser.total_goal);
  const pct = goal > 0 ? Math.min(100, (totalRaised / goal) * 100) : 0;
  const end = new Date(fundraiser.end_date);
  const daysLeft = Math.max(
    0,
    Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const sortedAthletes = [...athletes].sort(
    (a, b) =>
      (raisedByAthlete[b.id] ?? 0) - (raisedByAthlete[a.id] ?? 0)
  );

  const impliedPerAthleteGoal = useMemo(
    () => fundraiserImpliedPerAthleteGoal(fundraiser),
    [fundraiser]
  );

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const joinCode = fundraiser.join_code ?? "";

  const athleteInviteMessage = useMemo(() => {
    const ios =
      process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim() ||
      "[iPhone: paste your App Store link when the app is published]";
    const android =
      process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL?.trim() ||
      "[Android: paste your Google Play link when the app is published]";
    const codeLine = joinCode || "[team code from dashboard]";
    return `Hi team — we're using ${PLATFORM.shortName} for our fundraiser. Everyone joins in the mobile app (not the website).

1) Download the app:
   • iPhone: ${ios}
   • Android: ${android}
   If a link doesn't work yet, search "${PLATFORM.shortName}" in the App Store or Google Play.

2) Open the app → tap Team code → enter this code:
   ${codeLine}

3) Create your account with your email and a password you'll remember.

4) First time texting: go to Send Messages, allow contacts when asked, pick people to message, then save and send. Your personal donation link is included in the message.

More tips will show inside the app once you're in. Thanks!`;
  }, [joinCode]);

  async function copyAthleteInvite() {
    if (!athleteInviteMessage.trim()) return;
    await navigator.clipboard.writeText(athleteInviteMessage);
    setInviteCopied(true);
    window.setTimeout(() => setInviteCopied(false), 2500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
      <header className="border-b border-white/10 bg-gradient-to-r from-hh-dark via-[#252540] to-hh-dark text-white shadow-lg shadow-hh-dark/20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hh-primary">
              Coach dashboard
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
              {fundraiser.school_name}
            </h1>
            <p className="mt-0.5 text-lg font-semibold text-white/90">
              {fundraiser.team_name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              asChild
            >
              <Link href="/coach/new-fundraiser">New fundraiser</Link>
            </Button>
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              asChild
            >
              <a
                href={`/api/coach/export?fundraiserId=${fundraiser.id}`}
                download
              >
                Export CSV
              </a>
            </Button>
            <Button
              variant="secondary"
              className="bg-hh-primary text-white hover:bg-hh-primary/90"
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-4 text-sm text-sky-950 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-800">
            Quick reference
          </p>
          <ul className="list-disc space-y-1.5 pl-5 leading-snug text-sky-950">
            <li>
              <span className="font-medium">{PLATFORM.shortName} app</span> —
              same coach login. Text contacts and send reminders.
            </li>
            <li>
              <span className="font-medium">This site</span> — campaign setup,
              this dashboard, CSV export.
            </li>
          </ul>
        </div>

        <Card className="overflow-hidden border-slate-200/80 shadow-lg shadow-hh-dark/5">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/90">
            <CardTitle className="text-hh-dark">Campaign summary</CardTitle>
            <p className="text-sm text-slate-600">
              {formatDisplayDate(fundraiser.start_date)} →{" "}
              {formatDisplayDate(fundraiser.end_date)} ·{" "}
              <span className="font-medium text-hh-primary">{daysLeft} days</span>{" "}
              left
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <div className="mb-2 flex justify-between text-sm font-medium text-slate-700">
                <span>Team progress</span>
                <span>
                  ${totalRaised.toFixed(2)} / ${goal.toFixed(2)} (
                  {pct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-hh-primary to-orange-600 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {impliedPerAthleteGoal != null ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {fundraiser.goal_per_athlete != null &&
                  Number(fundraiser.goal_per_athlete) > 0 ? (
                    <>
                      Default <span className="font-medium">personal goal</span>{" "}
                      per athlete (roster and % columns use this when an athlete
                      has not set their own):{" "}
                    </>
                  ) : (
                    <>
                      Suggested per-athlete share (team goal ÷ expected{" "}
                      {fundraiser.expected_participants ?? "—"} participants):{" "}
                    </>
                  )}
                  <span className="font-semibold text-hh-dark">
                    ${impliedPerAthleteGoal.toFixed(2)}
                  </span>
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-hh-dark/10 bg-gradient-to-br from-hh-dark to-slate-800 p-5 text-white shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Team join code — for athletes only (app)
              </p>
              <p className="mt-2 break-all font-mono text-3xl font-bold tracking-[0.12em] sm:text-4xl sm:tracking-[0.18em]">
                {joinCode || "—".repeat(7)}
              </p>
              <p className="mt-3 rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm leading-relaxed text-white">
                <span className="font-semibold">You (coach):</span> In the mobile
                app, tap <strong>Sign in</strong> and use the{" "}
                <strong>same email and password</strong> as this website. Do not
                enter this team code—that code is only for athletes joining the
                campaign.
              </p>
              <p className="mt-3 text-sm font-medium text-white/90">
                Message for athletes (copy and paste into a group text or email)
              </p>
              <pre
                className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/20 bg-black/25 px-3 py-3 text-left text-xs leading-relaxed text-white/95 sm:text-sm"
                tabIndex={0}
                aria-label="Instructions to send to athletes"
              >
                {athleteInviteMessage}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="bg-white text-hh-dark hover:bg-white/90"
                  disabled={!joinCode}
                  onClick={() => void copyAthleteInvite()}
                >
                  {inviteCopied ? "Copied!" : "Copy message for athletes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <CoachParticipantCard
          fundraiser={fundraiser}
          coachAthlete={coachAthlete}
          baseUrl={baseUrl}
        />

        <Card>
          <CardHeader>
            <CardTitle>Athlete roster</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Jersey</TableHead>
                  <TableHead>Personal goal</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead>% goal</TableHead>
                  <TableHead>Texts sent</TableHead>
                  <TableHead>Donations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAthletes.map((a) => {
                  const raised = raisedByAthlete[a.id] ?? 0;
                  const target = effectivePersonalGoal(a, fundraiser);
                  const pctOfTarget =
                    target != null && target > 0
                      ? Math.round((raised / target) * 100)
                      : null;
                  const usesCampaignDefault =
                    target != null &&
                    (a.personal_goal == null ||
                      !Number.isFinite(Number(a.personal_goal)) ||
                      Number(a.personal_goal) <= 0);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.full_name}</TableCell>
                      <TableCell>{a.jersey_number ?? "—"}</TableCell>
                      <TableCell>
                        {target != null ? (
                          <span
                            title={
                              usesCampaignDefault
                                ? "Uses campaign default; athlete can set a personal goal in the app when supported."
                                : undefined
                            }
                          >
                            ${target.toFixed(2)}
                            {usesCampaignDefault ? (
                              <span className="ml-1 text-xs font-normal text-slate-500">
                                (default)
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>${raised.toFixed(2)}</TableCell>
                      <TableCell>
                        {pctOfTarget != null ? `${pctOfTarget}%` : "—"}
                      </TableCell>
                      <TableCell>{textsByAthlete[a.id] ?? 0}</TableCell>
                      <TableCell>{donationsByAthlete[a.id] ?? 0}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All donations</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Athlete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {formatDisplayDateTime(d.created_at)}
                    </TableCell>
                    <TableCell>
                      {d.anonymous ? "Anonymous" : d.donor_name ?? "—"}
                    </TableCell>
                    <TableCell>${Number(d.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      {athletes.find((a) => a.id === d.athlete_id)?.full_name ??
                        "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="underline">
            {BRAND.name}
          </Link>
        </p>
      </main>
    </div>
  );
}
