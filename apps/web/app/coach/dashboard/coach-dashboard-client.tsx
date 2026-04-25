"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/brand";
import type { Athlete, Donation, Fundraiser } from "@heart-and-hustle/shared";
import {
  PLATFORM,
  campaignDonationsBlockedMessage,
  campaignOutreachBlockedMessage,
  formatDisplayDate,
  formatDisplayDateTime,
  getCampaignWindowPhase,
  getDefaultDonorPageAboutText,
} from "@heart-and-hustle/shared";
import CoachParticipantCard from "./coach-participant-card";
import { updateCoachFundraiserDonorPageAbout } from "@/app/actions/coach";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

function progressMotivation(pct: number): string {
  if (pct >= 100) return "Team goal reached—outstanding work.";
  if (pct >= 75) return "Almost there—finish strong with your team.";
  if (pct >= 50) return "Past halfway—momentum is on your side.";
  if (pct > 0) return "Strong start—keep sharing those links.";
  return "Invite athletes and share links to see donations roll in.";
}

const statTones = {
  rose: "border-rose-300/80 bg-gradient-to-br from-rose-100 via-rose-100/90 to-rose-200/70 shadow-md shadow-rose-900/10 ring-1 ring-rose-900/[0.06]",
  amber:
    "border-amber-300/80 bg-gradient-to-br from-amber-100 via-amber-100/90 to-amber-200/65 shadow-md shadow-amber-900/10 ring-1 ring-amber-900/[0.06]",
  sky: "border-sky-300/80 bg-gradient-to-br from-sky-100 via-sky-100/90 to-sky-200/65 shadow-md shadow-sky-900/10 ring-1 ring-sky-900/[0.06]",
  coral:
    "border-red-300/75 bg-gradient-to-br from-red-100 via-rose-100/95 to-orange-100/70 shadow-md shadow-red-900/10 ring-1 ring-red-900/[0.06]",
  violet:
    "border-violet-300/75 bg-gradient-to-br from-violet-100 via-violet-100/90 to-fuchsia-200/55 shadow-md shadow-violet-900/10 ring-1 ring-violet-900/[0.06]",
  emerald:
    "border-emerald-300/75 bg-gradient-to-br from-emerald-100 via-emerald-100/90 to-teal-200/60 shadow-md shadow-emerald-900/10 ring-1 ring-emerald-900/[0.06]",
} as const;

type StatTone = keyof typeof statTones;

const statLabelTones: Record<
  StatTone,
  string
> = {
  rose: "text-rose-800/75",
  amber: "text-amber-900/70",
  sky: "text-sky-800/75",
  coral: "text-red-900/70",
  violet: "text-violet-900/70",
  emerald: "text-emerald-900/70",
};

function CommandStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: StatTone;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 ${statTones[tone]}`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-wider ${statLabelTones[tone]}`}
      >
        {label}
      </p>
      <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-hh-dark md:text-2xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] leading-snug text-slate-600/85">{hint}</p>
      ) : null}
    </div>
  );
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
  const [settingsPending, startSettingsTransition] = useTransition();
  const [donorPageAbout, setDonorPageAbout] = useState(
    () => fundraiser.donor_page_about ?? ""
  );
  const [donorPageEditOpen, setDonorPageEditOpen] = useState(false);
  const [donorAboutStatus, setDonorAboutStatus] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [joinCodeCopied, setJoinCodeCopied] = useState(false);

  useEffect(() => {
    setDonorPageAbout(fundraiser.donor_page_about ?? "");
    setDonorPageEditOpen(false);
  }, [fundraiser.id, fundraiser.donor_page_about]);
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

  const campaignPhase = useMemo(
    () =>
      getCampaignWindowPhase(fundraiser.start_date, fundraiser.end_date),
    [fundraiser.start_date, fundraiser.end_date]
  );

  const sortedAthletes = [...athletes].sort(
    (a, b) =>
      (raisedByAthlete[b.id] ?? 0) - (raisedByAthlete[a.id] ?? 0)
  );

  const analytics = useMemo(() => {
    const donationCount = donations.length;
    const textsSentTotal = Object.values(textsByAthlete).reduce(
      (s, v) => s + v,
      0
    );
    const avgDonation =
      donationCount > 0 ? totalRaised / donationCount : null;
    const dollarsPerText =
      textsSentTotal > 0 ? totalRaised / textsSentTotal : null;
    const donationsPerText =
      textsSentTotal > 0 ? donationCount / textsSentTotal : null;
    return {
      donationCount,
      textsSentTotal,
      avgDonation,
      dollarsPerText,
      donationsPerText,
    };
  }, [donations, textsByAthlete, totalRaised]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const joinCode = fundraiser.join_code ?? "";

  const participantInviteMessage = useMemo(() => {
    const ios =
      process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim() ||
      "[iPhone: paste your App Store link when the app is published]";
    const android =
      process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL?.trim() ||
      "[Android: paste your Google Play link when the app is published]";
    const codeLine = joinCode || "[team code from dashboard]";
    return `Hi team — we're using ${PLATFORM.shortName} for our fundraiser. All participants join in the mobile app (not the website).

1) Download the app:
   • iPhone: ${ios}
   • Android: ${android}
   If a link doesn't work yet, search "${PLATFORM.shortName}" in the App Store or Google Play.

2) Open the app → tap Team code → enter this code:
   ${codeLine}

3) Create your account with your email and a password you'll remember.

4) First time texting: go to Send Messages, allow contacts when asked, pick people to message, then Save & send. Your personal donation link is included in each message.

More tips will show inside the app once you're in. Thanks!`;
  }, [joinCode]);

  async function copyAthleteInvite() {
    if (!participantInviteMessage.trim()) return;
    await navigator.clipboard.writeText(participantInviteMessage);
    setInviteCopied(true);
    window.setTimeout(() => setInviteCopied(false), 2500);
  }

  async function copyJoinCodeOnly() {
    if (!joinCode.trim()) return;
    await navigator.clipboard.writeText(joinCode);
    setJoinCodeCopied(true);
    window.setTimeout(() => setJoinCodeCopied(false), 2000);
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
        {campaignPhase !== "active" ? (
          <div
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
            role="status"
          >
            <p className="font-semibold text-amber-900">
              Outside active campaign dates (Central Time)
            </p>
            <p className="mt-1 leading-snug">
              {campaignOutreachBlockedMessage(
                campaignPhase,
                fundraiser.start_date,
                fundraiser.end_date
              )}
            </p>
            <p className="mt-2 leading-snug text-amber-900/90">
              {campaignDonationsBlockedMessage(
                campaignPhase,
                fundraiser.start_date,
                fundraiser.end_date
              )}{" "}
              Team setup, join codes, and roster changes are still fine.
            </p>
          </div>
        ) : null}
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

        <Card className="border-slate-200/90 shadow-sm">
          <CardHeader className="space-y-1 pb-3 pt-4">
            <CardTitle className="text-base text-hh-dark">
              Donor page message
            </CardTitle>
            <p className="text-xs text-slate-500">
              Shown under &quot;About this fundraiser&quot; on each athlete&apos;s
              public donation link.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 pt-0">
            {donorPageEditOpen ? (
              <>
                <Textarea
                  id="coach-donor-about"
                  value={donorPageAbout}
                  onChange={(e) => {
                    setDonorPageAbout(e.target.value);
                    setDonorAboutStatus(null);
                  }}
                  rows={5}
                  maxLength={4000}
                  placeholder={getDefaultDonorPageAboutText(
                    fundraiser.team_name,
                    fundraiser.school_name
                  )}
                  className="resize-y text-sm placeholder:text-slate-400"
                  disabled={settingsPending}
                />
                <p className="text-xs text-slate-500">
                  {donorPageAbout.length.toLocaleString()} / 4,000 · leave blank
                  to use default after save
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={settingsPending}
                    onClick={() => {
                      setDonorAboutStatus(null);
                      startSettingsTransition(async () => {
                        try {
                          await updateCoachFundraiserDonorPageAbout({
                            fundraiserId: fundraiser.id,
                            donorPageAbout,
                          });
                          setDonorAboutStatus(
                            "Saved. Donation pages will show this text."
                          );
                          setDonorPageEditOpen(false);
                          router.refresh();
                        } catch (e: unknown) {
                          setDonorAboutStatus(
                            e instanceof Error ? e.message : "Could not save."
                          );
                        }
                      });
                    }}
                  >
                    {settingsPending ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={settingsPending}
                    onClick={() => {
                      setDonorPageAbout(fundraiser.donor_page_about ?? "");
                      setDonorAboutStatus(null);
                      setDonorPageEditOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/90 p-3 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {donorPageAbout.trim()
                    ? donorPageAbout
                    : getDefaultDonorPageAboutText(
                        fundraiser.team_name,
                        fundraiser.school_name
                      )}
                </div>
                {!donorPageAbout.trim() ? (
                  <p className="text-xs font-medium text-amber-900/80">
                    Using default copy — tap Edit to write your own.
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDonorAboutStatus(null);
                    setDonorPageEditOpen(true);
                  }}
                >
                  Edit
                </Button>
              </>
            )}
            {donorAboutStatus ? (
              <p className="text-sm text-slate-700" role="status">
                {donorAboutStatus}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-xl shadow-hh-dark/10 ring-1 ring-slate-200/80">
          <div className="relative overflow-hidden bg-gradient-to-br from-hh-dark via-[#252542] to-slate-900 px-5 pb-8 pt-6 text-white md:px-8 md:pb-10 md:pt-8">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-hh-primary/25 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl"
              aria-hidden
            />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-200/95">
                    Live campaign
                  </span>
                  <span className="text-xs text-white/70">
                    {formatDisplayDate(fundraiser.start_date)} →{" "}
                    {formatDisplayDate(fundraiser.end_date)}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">
                  Campaign command center
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
                  {progressMotivation(pct)}
                </p>
                <p className="mt-3 text-xs font-medium text-amber-200/90">
                  {daysLeft} day{daysLeft === 1 ? "" : "s"} left in the window
                </p>
              </div>
              <div className="relative w-full shrink-0 md:max-w-sm md:text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Team total raised
                </p>
                <p className="mt-1 text-4xl font-black tabular-nums tracking-tight md:text-5xl">
                  ${totalRaised.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-1 text-sm text-white/80">
                  Goal ${goal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ·{" "}
                  <span className="font-semibold text-amber-300">
                    {pct.toFixed(0)}%
                  </span>
                </p>
              </div>
            </div>
            <div className="relative mt-8">
              <div className="mb-2 flex justify-between text-xs font-medium text-white/70">
                <span>Progress to team goal</span>
                <span>
                  ${totalRaised.toFixed(2)} / ${goal.toFixed(2)}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/15 shadow-inner">
                <div
                  className="h-full min-h-[12px] rounded-full shadow-sm transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background:
                      "linear-gradient(to right, #C0392B 0%, #EAB308 42%, #22C55E 100%)",
                  }}
                />
              </div>
            </div>
            <div className="relative mt-6 flex flex-col gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                  Athlete app · team join code
                </p>
                <p className="mt-1 break-all font-mono text-2xl font-bold tracking-[0.14em] sm:text-3xl">
                  {joinCode || "—".repeat(7)}
                </p>
                <p className="mt-2 text-xs leading-snug text-white/65">
                  Coaches: sign in to the app with this website&apos;s email—do
                  not use this code.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="shrink-0 border-white/30 bg-white/95 text-hh-dark hover:bg-white"
                disabled={!joinCode}
                onClick={() => void copyJoinCodeOnly()}
              >
                {joinCodeCopied ? "Copied!" : "Copy code"}
              </Button>
            </div>
          </div>

          <CardContent className="space-y-6 bg-gradient-to-b from-slate-50/90 to-white px-5 py-6 md:px-8">
            <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-rose-100/70 via-amber-100/55 to-sky-100/65 p-5 shadow-inner ring-1 ring-slate-900/[0.05] md:p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Pulse and analytics
              </h3>
              <p className="mt-1 text-xs text-slate-600/90">
                Snapshot from donations and logged texts on this campaign.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                <CommandStat
                  tone="rose"
                  label="Avg gift"
                  value={
                    analytics.avgDonation != null
                      ? `$${analytics.avgDonation.toFixed(2)}`
                      : "—"
                  }
                  hint={
                    analytics.donationCount > 0
                      ? "Per donation received"
                      : "No donations yet"
                  }
                />
                <CommandStat
                  tone="amber"
                  label="Donations"
                  value={String(analytics.donationCount)}
                  hint="All gifts to your athletes"
                />
                <CommandStat
                  tone="sky"
                  label="Texts sent"
                  value={String(analytics.textsSentTotal)}
                  hint="Contacts messaged (app)"
                />
                <CommandStat
                  tone="coral"
                  label="$ / text"
                  value={
                    analytics.dollarsPerText != null
                      ? `$${analytics.dollarsPerText.toFixed(2)}`
                      : "—"
                  }
                  hint={
                    analytics.textsSentTotal > 0
                      ? "Raised per text logged"
                      : "No texts logged yet"
                  }
                />
                <CommandStat
                  tone="violet"
                  label="Donations / text"
                  value={
                    analytics.donationsPerText != null
                      ? analytics.donationsPerText.toFixed(2)
                      : "—"
                  }
                  hint={
                    analytics.textsSentTotal > 0
                      ? "Gifts per outreach logged"
                      : "—"
                  }
                />
                <CommandStat
                  tone="emerald"
                  label="Athletes"
                  value={String(athletes.length)}
                  hint="On this roster"
                />
              </div>
            </div>

            <details className="group rounded-xl border border-slate-300/90 bg-slate-50/50 shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-t-xl border-b border-slate-300/70 bg-gradient-to-r from-hh-primary/12 via-rose-100/80 to-amber-100/70 px-3 py-2.5 text-left transition-colors hover:from-hh-primary/18 hover:to-amber-100 sm:px-4 sm:py-3">
                <span className="text-xs font-extrabold uppercase leading-tight tracking-wide text-hh-dark sm:text-[13px]">
                  Invite message for participants — tap to view or copy
                </span>
                <span className="shrink-0 text-slate-500 transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <div className="border-t border-slate-200/80 px-4 py-4">
                <pre
                  className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white px-3 py-3 text-left text-xs leading-relaxed text-slate-700"
                  tabIndex={0}
                  aria-label="Instructions to send to participants"
                >
                  {participantInviteMessage}
                </pre>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  disabled={!joinCode}
                  onClick={() => void copyAthleteInvite()}
                >
                  {inviteCopied ? "Copied!" : "Copy full message"}
                </Button>
              </div>
            </details>
          </CardContent>
        </Card>

        <CoachParticipantCard
          fundraiser={fundraiser}
          coachAthlete={coachAthlete}
          baseUrl={baseUrl}
        />

        <Card className="overflow-hidden border-slate-200/90 shadow-md ring-1 ring-slate-900/5">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-hh-dark">Athlete roster</CardTitle>
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

        <Card className="overflow-hidden border-slate-200/90 shadow-md ring-1 ring-slate-900/5">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-hh-dark">All donations</CardTitle>
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
