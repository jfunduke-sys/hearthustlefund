"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/brand";
import {
  NEW_PASSWORD_REQUIREMENT_COPY,
  PLATFORM,
  SMS_REMINDER_CONSENT_CHECKBOX_COPY,
} from "@heart-and-hustle/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Fr = {
  id: string;
  team_name: string;
  school_name: string;
  unique_slug: string;
};

export default function ParticipateForm({ fundraiser }: { fundraiser: Fr }) {
  const [fullName, setFullName] = useState("");
  const [jersey, setJersey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smsMobile, setSmsMobile] = useState("");
  const [smsRemindersOptIn, setSmsRemindersOptIn] = useState(false);
  const [done, setDone] = useState<{
    donatePath: string;
    name: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email.trim()) {
      setError("Please enter your full name and email.");
      return;
    }
    if (password.length < 8) {
      setError(NEW_PASSWORD_REQUIREMENT_COPY);
      return;
    }
    if (smsRemindersOptIn) {
      const digits = smsMobile.replace(/\D/g, "");
      if (digits.length < 10) {
        setError(
          "Enter a valid 10-digit US mobile for SMS reminders, or uncheck SMS."
        );
        return;
      }
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const regRes = await fetch("/api/public/athlete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundraiserId: fundraiser.id,
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
          teamName: fundraiser.team_name,
          jerseyNumber: jersey.trim() || null,
          smsRemindersOptIn,
          mobilePhone: smsRemindersOptIn ? smsMobile.trim() : null,
        }),
      });
      const regJson = (await regRes.json()) as { error?: string };
      if (!regRes.ok) {
        throw new Error(regJson.error || "Could not create your account.");
      }

      const loginEmail = email.trim().toLowerCase();
      const { data: signInData, error: signErr } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
      if (signErr) throw signErr;
      const userId = signInData.session?.user?.id;
      if (!userId) throw new Error("Could not start your session.");

      const { data: athlete } = await supabase
        .from("athletes")
        .select("unique_link_token")
        .eq("user_id", userId)
        .eq("fundraiser_id", fundraiser.id)
        .single();

      if (!athlete?.unique_link_token) throw new Error("Could not load your link.");

      setDone({
        donatePath: `/donate/${athlete.unique_link_token}`,
        name: fullName.trim(),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const base =
      typeof window !== "undefined" ? window.location.origin : "";
    const fullDonate = `${base}${done.donatePath}`;
    return (
      <Card className="overflow-hidden border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white shadow-lg shadow-emerald-900/5">
        <CardHeader className="border-b border-emerald-100/80 bg-white/60 pb-4">
          <p className="text-2xl" aria-hidden>
            🎉
          </p>
          <CardTitle className="text-xl text-hh-dark">
            You&apos;re in, {done.name}!
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-slate-600">
            You&apos;re on the team. Your participant profile syncs with the{" "}
            {PLATFORM.shortName} app—same login, same campaign.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm font-medium text-slate-800">
            Your personal donation link
          </p>
          <p className="break-all rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800">
            {fullDonate}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-hh-primary hover:bg-hh-primary/90">
              <Link href={done.donatePath}>Preview donation page</Link>
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => void navigator.clipboard.writeText(fullDonate)}
            >
              Copy link
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            For contacts and texting, open the {PLATFORM.shortName} app and sign
            in with the same email.
          </p>
          <Link href="/" className="text-sm font-medium text-hh-primary hover:underline">
            ← {BRAND.name}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-slate-200/90 shadow-xl shadow-hh-dark/10">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80 pb-4">
        <CardTitle className="text-2xl font-bold text-hh-dark">
          Join as a participant
        </CardTitle>
        <div className="space-y-2 pt-1 text-base leading-relaxed text-slate-600">
          <p>
            <span className="font-semibold text-hh-dark">
              {fundraiser.school_name}
            </span>
            <span className="text-slate-400"> · </span>
            <span className="font-semibold text-hh-primary">
              {fundraiser.team_name}
            </span>
          </p>
          <p className="text-sm">
            Create your login below. You&apos;ll get your own donation page to
            share with supporters—quick to set up, easy to text from your phone
            in the app.
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={onSubmit} autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="hh-participant-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Input id="team" value={fundraiser.team_name} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jersey">Jersey # (optional)</Label>
            <Input
              id="jersey"
              name="hh-participant-jersey"
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (your login)</Label>
            <Input
              id="email"
              name="hh-participant-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <p className="text-xs leading-relaxed text-slate-500">
              {NEW_PASSWORD_REQUIREMENT_COPY}
            </p>
            <Input
              id="password"
              name="hh-participant-new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-medium text-hh-dark">
              Optional: campaign SMS reminders
            </p>
            <div className="space-y-2">
              <Label htmlFor="smsMobile">US mobile (if you want texts)</Label>
              <Input
                id="smsMobile"
                name="hh-participant-sms-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={smsMobile}
                onChange={(e) => setSmsMobile(e.target.value)}
                placeholder="10-digit mobile"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-700">
              <Checkbox
                checked={smsRemindersOptIn}
                onCheckedChange={(v) =>
                  setSmsRemindersOptIn(v === true)
                }
                className="mt-0.5"
                aria-labelledby="sms-consent-label"
              />
              <span id="sms-consent-label">
                {SMS_REMINDER_CONSENT_CHECKBOX_COPY}{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-hh-primary underline"
                >
                  Terms
                </Link>
                ,{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-hh-primary underline"
                >
                  Privacy
                </Link>
                ,{" "}
                <Link
                  href="/sms-reminders"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-hh-primary underline"
                >
                  SMS program page
                </Link>
                .
              </span>
            </label>
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full bg-hh-primary text-base font-semibold hover:bg-hh-primary/90"
            disabled={loading}
          >
            {loading ? "Saving…" : "Create account & join team"}
          </Button>
          <p className="text-center text-xs text-slate-500">
            If email and password look filled-in already, that&apos;s your
            browser&apos;s saved passwords—not us. Clear the fields or use a
            private window if it&apos;s the wrong account.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
