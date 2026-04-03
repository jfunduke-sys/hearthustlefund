"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createFundraiserAction,
  getNewFundraiserPrefillAction,
} from "@/app/actions/coach";
import { BRAND } from "@/lib/brand";
import {
  CAMPAIGN_SETUP_CODE,
  normalizeFundraiserSetupCode,
} from "@heart-and-hustle/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const PENDING_EMAIL_KEY = "hh_pending_activation_email";
const PENDING_CODE_KEY = "hh_pending_activation_code";

function hasPendingActivationKeys(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      !!sessionStorage.getItem(PENDING_EMAIL_KEY) &&
      !!sessionStorage.getItem(PENDING_CODE_KEY)
    );
  } catch {
    return false;
  }
}

function parsePositiveInt(s: string): number | null {
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function NewFundraiserClient({ initialCode }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(() => (initialCode ? 2 : 1));
  const [code, setCode] = useState(() =>
    initialCode ? normalizeFundraiserSetupCode(initialCode) : ""
  );
  const [showActivationReadyNote, setShowActivationReadyNote] = useState(
    () => !!initialCode
  );
  const [resolvingPending, setResolvingPending] = useState(
    () => !initialCode && hasPendingActivationKeys()
  );
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [doneInfo, setDoneInfo] = useState<{
    slug: string;
    joinCode: string;
  } | null>(null);

  const lastPrefilledCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialCode) {
      setResolvingPending(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        let storedEmail: string | null = null;
        let storedCode: string | null = null;
        try {
          storedEmail = sessionStorage.getItem(PENDING_EMAIL_KEY);
          storedCode = sessionStorage.getItem(PENDING_CODE_KEY);
        } catch {
          return;
        }
        if (!storedEmail || !storedCode) return;

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const u = user?.email?.toLowerCase().trim();
        if (!u || u !== storedEmail.toLowerCase().trim()) {
          try {
            sessionStorage.removeItem(PENDING_EMAIL_KEY);
            sessionStorage.removeItem(PENDING_CODE_KEY);
          } catch {
            /* private mode */
          }
          return;
        }
        if (cancelled) return;

        try {
          sessionStorage.removeItem(PENDING_EMAIL_KEY);
          sessionStorage.removeItem(PENDING_CODE_KEY);
        } catch {
          /* private mode */
        }

        setCode(storedCode);
        setStep(2);
        setShowActivationReadyNote(true);
      } finally {
        if (!cancelled) setResolvingPending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialCode]);

  const [schoolName, setSchoolName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [participantCount, setParticipantCount] = useState("");
  const [goalEntryMode, setGoalEntryMode] = useState<"total" | "per">("total");
  const [totalGoal, setTotalGoal] = useState("");
  const [perAthlete, setPerAthlete] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 2) return;
    const codeNorm = normalizeFundraiserSetupCode(code);
    if (!codeNorm) return;
    if (lastPrefilledCodeRef.current === codeNorm) return;
    lastPrefilledCodeRef.current = codeNorm;

    void (async () => {
      try {
        const p = await getNewFundraiserPrefillAction(codeNorm);
        if (!p) return;
        if (p.school_name) setSchoolName(p.school_name);
        if (p.team_name) setTeamName(p.team_name);
        if (p.start_date) setStartDate(p.start_date);
        if (p.end_date) setEndDate(p.end_date);
        if (p.participant_count != null) {
          setParticipantCount(String(p.participant_count));
        }
      } catch {
        /* prefill is best-effort */
      }
    })();
  }, [step, code]);

  async function validateCode() {
    setCodeError(null);
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setCodeError("You must be signed in.");
      setLoading(false);
      return;
    }
    const email = user.email.toLowerCase().trim();
    const codeNorm = normalizeFundraiserSetupCode(code);
    const { data: row } = await supabase
      .from("fundraiser_codes")
      .select("*")
      .eq("code", codeNorm)
      .maybeSingle();

    if (!row) {
      setCodeError("Code not found.");
      setLoading(false);
      return;
    }
    if (row.used) {
      setCodeError("This code has already been used.");
      setLoading(false);
      return;
    }
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      setCodeError("This code has expired.");
      setLoading(false);
      return;
    }
    const assigned = row.assigned_to_email?.trim().toLowerCase();
    if (!assigned) {
      setCodeError(
        "This code is not assigned to a coach email. Contact Heart & Hustle support."
      );
      setLoading(false);
      return;
    }
    if (assigned !== email) {
      setCodeError(
        "This code is for a different coach. Sign in with the email that received the code."
      );
      setLoading(false);
      return;
    }

    setCode(codeNorm);
    setLoading(false);
    setStep(2);
  }

  async function uploadLogo(file: File | null) {
    if (!file) return null;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const path = `${user.id}/school-team-${Date.now()}-${file.name.replace(/[^\w.-]/g, "")}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    return data.publicUrl;
  }

  const n = parsePositiveInt(participantCount);
  const totalParsed = parseFloat(totalGoal);
  const perParsed = parseFloat(perAthlete);

  const computedPerFromTotal =
    goalEntryMode === "total" &&
    n != null &&
    Number.isFinite(totalParsed) &&
    totalParsed > 0
      ? Math.ceil(totalParsed / n)
      : null;

  const computedTotalFromPer =
    goalEntryMode === "per" &&
    n != null &&
    Number.isFinite(perParsed) &&
    perParsed > 0
      ? roundMoney(n * perParsed)
      : null;

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

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

    setLoading(true);
    try {
      const logoUrl = await uploadLogo(logoFile);
      const res = await createFundraiserAction({
        code: normalizeFundraiserSetupCode(code),
        school_name: schoolName.trim(),
        team_name: teamName.trim(),
        total_goal: finalTotal,
        goal_per_athlete: finalPer,
        expected_participants: participants,
        start_date: startDate,
        end_date: endDate,
        school_logo_url: logoUrl,
        team_logo_url: logoUrl,
      });
      setDoneInfo({
        slug: res.unique_slug,
        joinCode: res.join_code,
      });
      try {
        sessionStorage.removeItem(PENDING_EMAIL_KEY);
        sessionStorage.removeItem(PENDING_CODE_KEY);
      } catch {
        /* private mode */
      }
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Could not create fundraiser");
    } finally {
      setLoading(false);
    }
  }

  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link href="/coach/dashboard" className="text-sm text-hh-primary hover:underline">
          ← Dashboard
        </Link>
        <Card className="mt-6 border-hh-dark/10">
          <CardHeader>
            <CardTitle className="text-hh-dark">New fundraiser</CardTitle>
            <CardDescription>{BRAND.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {doneInfo ? (
              <div className="space-y-5">
                <p className="font-semibold text-emerald-800">
                  Your fundraiser is live!
                </p>
                <div className="rounded-xl border border-hh-dark/10 bg-gradient-to-br from-hh-dark to-slate-800 p-4 text-center text-white shadow-inner">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                    Team join code — for athletes only
                  </p>
                  <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em]">
                    {doneInfo.joinCode}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      void navigator.clipboard.writeText(doneInfo.joinCode)
                    }
                  >
                    Copy code
                  </Button>
                </div>
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950">
                  <strong>You (coach):</strong> On the mobile app, use{" "}
                  <strong>Sign in</strong> with the same email and password as this
                  website—<strong>not</strong> this team code. Send the code only to
                  athletes.
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Athletes</strong> use the <strong>mobile app</strong> with
                  this code (Team code tab). Point them to{" "}
                  <span className="font-medium">{base}/join</span> if they need
                  download instructions—not for signup on the web.
                </p>
                <p className="break-all rounded-md bg-slate-100 p-3 font-mono text-xs text-slate-700">
                  Optional link: {base}/join/{doneInfo.slug}
                </p>
                <Button variant="outline" asChild>
                  <Link href="/coach/dashboard">Back to dashboard</Link>
                </Button>
              </div>
            ) : resolvingPending ? (
              <p className="text-sm text-slate-600">
                Checking your fundraiser setup…
              </p>
            ) : step === 1 ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Enter the fundraiser code you received from Heart & Hustle. If
                  you just used <strong>Coach login → Start with my code</strong>,
                  you can skip this step—you&apos;re already verified.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="code">Fundraiser code</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onBlur={() =>
                      setCode((c) =>
                        c.trim() ? normalizeFundraiserSetupCode(c) : c
                      )
                    }
                    placeholder="HH-XXXX-XXXX"
                    className="font-mono"
                  />
                  <p className="text-xs leading-relaxed text-slate-500">
                    {CAMPAIGN_SETUP_CODE.inputFormatHint}
                  </p>
                </div>
                {codeError ? (
                  <p className="text-sm text-red-600">{codeError}</p>
                ) : null}
                <Button
                  type="button"
                  className="w-full"
                  disabled={
                    loading || !normalizeFundraiserSetupCode(code).trim()
                  }
                  onClick={() => void validateCode()}
                >
                  {loading ? "Checking…" : "Continue"}
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onCreate}>
                {showActivationReadyNote ? (
                  <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Code <span className="font-mono font-medium">{code}</span> is
                    ready. Complete your campaign details below.
                  </p>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="school">School name</Label>
                  <Input
                    id="school"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team">Team name</Label>
                  <Input
                    id="team"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participants">Number of participants</Label>
                  <Input
                    id="participants"
                    type="number"
                    min={1}
                    step={1}
                    value={participantCount}
                    onChange={(e) => setParticipantCount(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Prefilled from your school request when available; you can change
                    it.
                  </p>
                </div>

                <fieldset className="space-y-2 rounded-md border border-slate-200 p-3">
                  <legend className="px-1 text-sm font-medium text-slate-800">
                    Fundraising goal
                  </legend>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="goalMode"
                        checked={goalEntryMode === "total"}
                        onChange={() => {
                          setGoalEntryMode("total");
                          if (
                            n != null &&
                            Number.isFinite(perParsed) &&
                            perParsed > 0
                          ) {
                            setTotalGoal(String(roundMoney(n * perParsed)));
                          }
                        }}
                        className="accent-hh-primary"
                      />
                      I know the total team goal
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="goalMode"
                        checked={goalEntryMode === "per"}
                        onChange={() => {
                          setGoalEntryMode("per");
                          if (
                            n != null &&
                            Number.isFinite(totalParsed) &&
                            totalParsed > 0
                          ) {
                            setPerAthlete(String(Math.ceil(totalParsed / n)));
                          }
                        }}
                        className="accent-hh-primary"
                      />
                      I know the goal per participant
                    </label>
                  </div>

                  {goalEntryMode === "total" ? (
                    <>
                      <div className="space-y-2 pt-1">
                        <Label htmlFor="total">Total fundraising goal ($)</Label>
                        <Input
                          id="total"
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={totalGoal}
                          onChange={(e) => setTotalGoal(e.target.value)}
                          required
                        />
                      </div>
                      {computedPerFromTotal != null ? (
                        <p className="text-sm text-slate-700">
                          Per participant:{" "}
                          <strong>${computedPerFromTotal}</strong>
                          <span className="text-slate-500">
                            {" "}
                            (rounded up to the nearest whole dollar)
                          </span>
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="space-y-2 pt-1">
                        <Label htmlFor="per">Goal per participant ($)</Label>
                        <Input
                          id="per"
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={perAthlete}
                          onChange={(e) => setPerAthlete(e.target.value)}
                          required
                        />
                      </div>
                      {computedTotalFromPer != null ? (
                        <p className="text-sm text-slate-700">
                          Total team goal:{" "}
                          <strong>
                            ${computedTotalFromPer.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </strong>
                        </p>
                      ) : null}
                    </>
                  )}
                </fieldset>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start date</Label>
                    <Input
                      id="start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End date</Label>
                    <Input
                      id="end"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">School/Team Logo Upload</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-slate-500">Optional.</p>
                </div>
                {formError ? (
                  <p className="text-sm text-red-600">{formError}</p>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Creating…" : "Create fundraiser"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
