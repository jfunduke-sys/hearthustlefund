"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Athlete, Fundraiser } from "@heart-and-hustle/shared";
import { getDefaultDonorPageAboutText } from "@heart-and-hustle/shared";
import {
  supportUpdateFundraiserCore,
  supportUpdateUsesCampaignGroups,
} from "@/app/actions/campaign-support";
import CoachGroupsSetup, {
  type CoachGroupRow,
} from "@/app/coach/dashboard/coach-groups-setup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type GroupsSetup = {
  groups: CoachGroupRow[];
  memberGroupByAthleteId: Record<string, string | null>;
  managerUserIdByGroupId: Record<string, string | null>;
};

type Props = {
  fundraiser: Fundraiser;
  coachEmail: string | null;
  athletes: Pick<Athlete, "id" | "full_name" | "user_id">[];
  groupsSetup: GroupsSetup | null;
};

export default function CampaignSupportFundraiserClient({
  fundraiser: initialFr,
  coachEmail,
  athletes,
  groupsSetup: initialGroups,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [groupsPending, startGroupsTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [schoolName, setSchoolName] = useState(initialFr.school_name);
  const [teamName, setTeamName] = useState(initialFr.team_name);
  const [totalGoal, setTotalGoal] = useState(String(initialFr.total_goal));
  const [goalPerAthlete, setGoalPerAthlete] = useState(
    initialFr.goal_per_athlete != null ? String(initialFr.goal_per_athlete) : ""
  );
  const [expectedParticipants, setExpectedParticipants] = useState(
    initialFr.expected_participants != null
      ? String(initialFr.expected_participants)
      : ""
  );
  const [startDate, setStartDate] = useState(initialFr.start_date);
  const [endDate, setEndDate] = useState(initialFr.end_date);
  const [donorAbout, setDonorAbout] = useState(initialFr.donor_page_about ?? "");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState(
    initialFr.school_logo_url ?? ""
  );
  const [teamLogoUrl, setTeamLogoUrl] = useState(initialFr.team_logo_url ?? "");

  const [usesLocal, setUsesLocal] = useState(
    initialFr.uses_campaign_groups === true
  );
  const [groupsOffOpen, setGroupsOffOpen] = useState(false);

  useEffect(() => {
    setSchoolName(initialFr.school_name);
    setTeamName(initialFr.team_name);
    setTotalGoal(String(initialFr.total_goal));
    setGoalPerAthlete(
      initialFr.goal_per_athlete != null ? String(initialFr.goal_per_athlete) : ""
    );
    setExpectedParticipants(
      initialFr.expected_participants != null
        ? String(initialFr.expected_participants)
        : ""
    );
    setStartDate(initialFr.start_date);
    setEndDate(initialFr.end_date);
    setDonorAbout(initialFr.donor_page_about ?? "");
    setSchoolLogoUrl(initialFr.school_logo_url ?? "");
    setTeamLogoUrl(initialFr.team_logo_url ?? "");
    setUsesLocal(initialFr.uses_campaign_groups === true);
  }, [initialFr]);

  if (initialFr.status !== "active") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Campaign support editing is only available for <strong>active</strong>{" "}
        fundraisers. This campaign is <strong>{initialFr.status}</strong>. Use the
        standard admin fundraiser page for read-only review.
      </div>
    );
  }

  function saveCore() {
    setMsg(null);
    const tg = parseFloat(totalGoal);
    if (!Number.isFinite(tg) || tg <= 0) {
      setMsg("Enter a valid total goal.");
      return;
    }
    const gp = goalPerAthlete.trim()
      ? parseFloat(goalPerAthlete)
      : null;
    if (gp != null && (!Number.isFinite(gp) || gp <= 0)) {
      setMsg("Goal per participant must be a positive number or empty.");
      return;
    }
    const exp = expectedParticipants.trim()
      ? parseInt(expectedParticipants, 10)
      : null;
    if (exp != null && (!Number.isFinite(exp) || exp < 1)) {
      setMsg("Expected participants must be at least 1 or empty.");
      return;
    }
    if (!startDate || !endDate) {
      setMsg("Start and end dates are required.");
      return;
    }

    startTransition(async () => {
      try {
        await supportUpdateFundraiserCore({
          fundraiserId: initialFr.id,
          school_name: schoolName.trim(),
          team_name: teamName.trim(),
          total_goal: tg,
          goal_per_athlete: gp,
          expected_participants: exp,
          start_date: startDate,
          end_date: endDate,
          school_logo_url: schoolLogoUrl.trim() || null,
          team_logo_url: teamLogoUrl.trim() || null,
          donor_page_about: donorAbout.trim() || null,
        });
        setMsg("Saved.");
        router.refresh();
      } catch (e: unknown) {
        setMsg(e instanceof Error ? e.message : "Could not save.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">← SuperAdmin</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/fundraisers/${initialFr.id}`}>Admin fundraiser view</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-hh-dark">
          Campaign support · {initialFr.school_name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Organizer: <strong>{coachEmail ?? "—"}</strong> · Join code{" "}
          <span className="font-mono">{initialFr.join_code ?? "—"}</span> · Public join{" "}
          <Link
            className="text-hh-primary underline"
            href={`/join/${initialFr.unique_slug}`}
            target="_blank"
            rel="noreferrer"
          >
            /join/{initialFr.unique_slug}
          </Link>
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Changing school/team names does not change the public URL slug (
          <span className="font-mono">{initialFr.unique_slug}</span>) — bookmarked links
          stay valid. Dates and goals can affect reporting; edit carefully during a live
          campaign.
        </p>
      </div>

      {msg ? (
        <p
          className={cn(
            "text-sm",
            msg === "Saved." ? "text-emerald-800" : "text-red-700"
          )}
          role="status"
        >
          {msg}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>School name</Label>
            <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Team / program name</Label>
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Total goal ($)</Label>
            <Input
              inputMode="decimal"
              value={totalGoal}
              onChange={(e) => setTotalGoal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Goal per participant ($, optional)</Label>
            <Input
              inputMode="decimal"
              value={goalPerAthlete}
              onChange={(e) => setGoalPerAthlete(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Expected participants (optional)</Label>
            <Input
              inputMode="numeric"
              value={expectedParticipants}
              onChange={(e) =>
                setExpectedParticipants(e.target.value.replace(/\D/g, ""))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>School logo URL</Label>
            <Input
              type="url"
              value={schoolLogoUrl}
              onChange={(e) => setSchoolLogoUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Team logo URL</Label>
            <Input
              type="url"
              value={teamLogoUrl}
              onChange={(e) => setTeamLogoUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Donor page “About”</Label>
            <Textarea
              rows={4}
              maxLength={4000}
              value={donorAbout}
              onChange={(e) => setDonorAbout(e.target.value)}
              placeholder={getDefaultDonorPageAboutText(teamName, schoolName)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="button" disabled={pending} onClick={() => saveCore()}>
              {pending ? "Saving…" : "Save campaign details"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Teams / groups</CardTitle>
          <p className="text-sm text-slate-600">
            Turning teams/groups off permanently deletes group configuration. Confirm
            with the organizer when possible.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <button
              type="button"
              disabled={groupsPending}
              onClick={() => {
                if (usesLocal) {
                  setMsg(null);
                  setGroupsOffOpen(true);
                }
              }}
              className={cn(
                "flex w-full gap-3 rounded-lg border p-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-hh-primary/40",
                !usesLocal
                  ? "border-hh-primary/45 bg-white shadow-sm ring-2 ring-hh-primary/20"
                  : "border-transparent bg-white/50 hover:bg-white/90"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  !usesLocal
                    ? "border-hh-primary bg-hh-primary"
                    : "border-slate-400 bg-white"
                )}
                aria-hidden
              >
                {!usesLocal ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-hh-dark">Single roster</span>
                <span className="mt-1 block text-sm leading-snug text-slate-600">
                  One participant list and one team total.
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={groupsPending}
              onClick={() => {
                if (!usesLocal) {
                  setMsg(null);
                  startGroupsTransition(async () => {
                    try {
                      await supportUpdateUsesCampaignGroups({
                        fundraiserId: initialFr.id,
                        usesCampaignGroups: true,
                      });
                      setUsesLocal(true);
                      router.refresh();
                    } catch (e: unknown) {
                      setMsg(e instanceof Error ? e.message : "Could not update.");
                    }
                  });
                }
              }}
              className={cn(
                "flex w-full gap-3 rounded-lg border p-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-hh-primary/40",
                usesLocal
                  ? "border-hh-primary/45 bg-white shadow-sm ring-2 ring-hh-primary/20"
                  : "border-transparent bg-white/50 hover:bg-white/90"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  usesLocal
                    ? "border-hh-primary bg-hh-primary"
                    : "border-slate-400 bg-white"
                )}
                aria-hidden
              >
                {usesLocal ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-hh-dark">Teams and groups</span>
                <span className="mt-1 block text-sm leading-snug text-slate-600">
                  Named groups, managers, and participant placement.
                </span>
              </span>
            </button>
          </div>

          {usesLocal && initialGroups ? (
            <div className="border-t border-slate-100 pt-5">
              <CoachGroupsSetup
                fundraiserId={initialFr.id}
                groups={initialGroups.groups}
                memberGroupByAthleteId={initialGroups.memberGroupByAthleteId}
                managerUserIdByGroupId={initialGroups.managerUserIdByGroupId}
                athletes={athletes}
                useCampaignSupportActions
              />
            </div>
          ) : usesLocal && !initialGroups ? (
            <p className="text-sm text-slate-600">
              Groups are on but no group rows loaded yet. Save “Teams and groups” above,
              then refresh—if this persists, create group shells from the organizer
              dashboard once.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={groupsOffOpen} onOpenChange={setGroupsOffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn off teams and groups?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  This permanently deletes all groups, manager assignments, and
                  participant placements for this campaign.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={groupsPending}
              onClick={() => setGroupsOffOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-red-300 bg-red-50 font-semibold text-red-900 hover:bg-red-100"
              disabled={groupsPending}
              onClick={() => {
                setMsg(null);
                startGroupsTransition(async () => {
                  try {
                    await supportUpdateUsesCampaignGroups({
                      fundraiserId: initialFr.id,
                      usesCampaignGroups: false,
                    });
                    setUsesLocal(false);
                    setGroupsOffOpen(false);
                    router.refresh();
                  } catch (e: unknown) {
                    setMsg(e instanceof Error ? e.message : "Could not update.");
                  }
                });
              }}
            >
              {groupsPending ? "Working…" : "Turn off and clear groups"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
