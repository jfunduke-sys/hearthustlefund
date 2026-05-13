"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  supportCreateFundraiserFromCode,
  supportGetNewFundraiserPrefillForCode,
  supportValidateCodeForCreate,
} from "@/app/actions/campaign-support";
import {
  getDefaultDonorPageAboutText,
  normalizeFundraiserSetupCode,
} from "@heart-and-hustle/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  initialCode: string | null;
};

function parsePositiveInt(s: string): number | null {
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function CampaignSupportCreateClient({ initialCode }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState(() =>
    initialCode ? normalizeFundraiserSetupCode(initialCode) : ""
  );
  const [codeMeta, setCodeMeta] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [participantCount, setParticipantCount] = useState("");
  const [goalEntryMode, setGoalEntryMode] = useState<"total" | "per">("total");
  const [totalGoal, setTotalGoal] = useState("");
  const [perAthlete, setPerAthlete] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [donorPageAbout, setDonorPageAbout] = useState("");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState("");
  const [teamLogoUrl, setTeamLogoUrl] = useState("");
  const [usesCampaignGroups, setUsesCampaignGroups] = useState(false);
  const [assignedEmailHint, setAssignedEmailHint] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [doneInvited, setDoneInvited] = useState(false);

  useEffect(() => {
    const c = normalizeFundraiserSetupCode(code);
    if (!c) return;
    let cancelled = false;
    void (async () => {
      try {
        const v = await supportValidateCodeForCreate(c);
        if (cancelled) return;
        if (!v.ok) {
          setCodeMeta(v.error);
          return;
        }
        setCodeMeta(null);
        if (v.assigned_to_email) {
          setAssignedEmailHint(v.assigned_to_email);
        }
        const p = await supportGetNewFundraiserPrefillForCode(c);
        if (cancelled) return;
        if (p?.assigned_to_email) {
          setAssignedEmailHint(p.assigned_to_email);
        }
        if (!p) return;
        if (p.school_name) setSchoolName(p.school_name);
        if (p.team_name) setTeamName(p.team_name);
        if (p.start_date) setStartDate(p.start_date);
        if (p.end_date) setEndDate(p.end_date);
        if (p.participant_count != null) {
          setParticipantCount(String(p.participant_count));
        }
        setUsesCampaignGroups(p.wants_campaign_groups === true);
        setAssignedEmailHint(p.assigned_to_email);
      } catch (e: unknown) {
        if (!cancelled) {
          setCodeMeta(e instanceof Error ? e.message : "Could not load code.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const codeNorm = normalizeFundraiserSetupCode(code);
    if (!codeNorm) {
      setFormError("Enter a valid HH fundraiser code.");
      return;
    }

    const participants = parsePositiveInt(participantCount);
    if (participants == null) {
      setFormError("Enter a valid number of participants (at least 1).");
      return;
    }

    let finalTotal: number;
    let finalPer: number | null;

    if (goalEntryMode === "total") {
      const g = parseFloat(totalGoal);
      if (!Number.isFinite(g) || g <= 0) {
        setFormError("Enter a valid total fundraising goal.");
        return;
      }
      finalTotal = g;
      finalPer = Math.ceil(g / participants);
    } else {
      const p = parseFloat(perAthlete);
      if (!Number.isFinite(p) || p <= 0) {
        setFormError("Enter a valid goal per participant.");
        return;
      }
      finalPer = p;
      finalTotal = roundMoney(participants * p);
    }

    if (!startDate || !endDate) {
      setFormError("Start and end dates are required.");
      return;
    }

    const schoolUrl = schoolLogoUrl.trim() || null;
    const teamUrl = teamLogoUrl.trim() || null;

    startTransition(async () => {
      try {
        const res = await supportCreateFundraiserFromCode({
          code: codeNorm,
          school_name: schoolName.trim(),
          team_name: teamName.trim(),
          total_goal: finalTotal,
          goal_per_athlete: finalPer,
          expected_participants: participants,
          start_date: startDate,
          end_date: endDate,
          school_logo_url: schoolUrl,
          team_logo_url: teamUrl,
          donor_page_about: donorPageAbout.trim() || null,
          uses_campaign_groups: usesCampaignGroups,
        });
        setDoneId(res.fundraiserId);
        setDoneInvited(res.organizerInvited);
        router.refresh();
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : "Could not create fundraiser.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">← SuperAdmin</Link>
        </Button>
        <Card className="mt-6 border-slate-200">
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Campaign support
            </p>
            <CardTitle>Create campaign (HH code)</CardTitle>
            <CardDescription>
              Creates the live fundraiser, marks the code used, and invites the
              organizer by email if they do not have an account yet. They land on the
              dashboard after first sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {doneId ? (
              <div className="space-y-4">
                <p className="font-medium text-emerald-800">Campaign created.</p>
                {doneInvited ? (
                  <p className="text-sm text-slate-700">
                    An invitation email was sent to the organizer so they can set a
                    password. After that, they go straight to the dashboard for this
                    campaign.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={`/admin/campaign-support/f/${doneId}`}>
                      Open campaign support
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/admin/fundraisers/${doneId}`}>Admin fundraiser view</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="sup-code">HH setup code</Label>
                  <Input
                    id="sup-code"
                    className="font-mono"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onBlur={() =>
                      setCode((c) =>
                        c.trim() ? normalizeFundraiserSetupCode(c) : c
                      )
                    }
                    placeholder="HH-XXXX-XXXX"
                    required
                  />
                  {assignedEmailHint ? (
                    <p className="text-xs text-slate-600">
                      Assigned organizer email:{" "}
                      <strong>{assignedEmailHint}</strong>
                    </p>
                  ) : null}
                  {codeMeta ? (
                    <p className="text-sm text-red-700" role="alert">
                      {codeMeta}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sup-school">School name</Label>
                  <Input
                    id="sup-school"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sup-team">Team / program name</Label>
                  <Input
                    id="sup-team"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Goal entry</Label>
                  <div className="flex gap-4 text-sm">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="goalMode"
                        checked={goalEntryMode === "total"}
                        onChange={() => setGoalEntryMode("total")}
                      />
                      Total goal
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="goalMode"
                        checked={goalEntryMode === "per"}
                        onChange={() => setGoalEntryMode("per")}
                      />
                      Per participant
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sup-pc">Expected participants</Label>
                  <Input
                    id="sup-pc"
                    inputMode="numeric"
                    value={participantCount}
                    onChange={(e) =>
                      setParticipantCount(e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                </div>

                {goalEntryMode === "total" ? (
                  <div className="space-y-2">
                    <Label htmlFor="sup-total">Total goal ($)</Label>
                    <Input
                      id="sup-total"
                      inputMode="decimal"
                      value={totalGoal}
                      onChange={(e) => setTotalGoal(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="sup-per">Goal per participant ($)</Label>
                    <Input
                      id="sup-per"
                      inputMode="decimal"
                      value={perAthlete}
                      onChange={(e) => setPerAthlete(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sup-start">Start date</Label>
                    <Input
                      id="sup-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sup-end">End date</Label>
                    <Input
                      id="sup-end"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={usesCampaignGroups}
                    onChange={(e) => setUsesCampaignGroups(e.target.checked)}
                  />
                  <span>
                    Enable teams / groups for this campaign (organizer can still edit
                    later).
                  </span>
                </label>

                <div className="space-y-2">
                  <Label htmlFor="sup-school-logo">School logo URL (optional)</Label>
                  <Input
                    id="sup-school-logo"
                    type="url"
                    value={schoolLogoUrl}
                    onChange={(e) => setSchoolLogoUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sup-team-logo">Team logo URL (optional)</Label>
                  <Input
                    id="sup-team-logo"
                    type="url"
                    value={teamLogoUrl}
                    onChange={(e) => setTeamLogoUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sup-about">Donor page “About” (optional)</Label>
                  <Textarea
                    id="sup-about"
                    rows={4}
                    maxLength={4000}
                    value={donorPageAbout}
                    onChange={(e) => setDonorPageAbout(e.target.value)}
                    placeholder={getDefaultDonorPageAboutText(
                      teamName || "Team",
                      schoolName || "School"
                    )}
                  />
                </div>

                {formError ? (
                  <p className="text-sm text-red-700" role="alert">
                    {formError}
                  </p>
                ) : null}

                <Button type="submit" disabled={pending || !!codeMeta}>
                  {pending ? "Creating…" : "Create campaign"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
