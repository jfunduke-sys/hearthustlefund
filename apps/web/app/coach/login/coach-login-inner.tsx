"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { verifyAndSetCoachActivationCookie } from "@/app/actions/coach-activation";
import { BRAND } from "@/lib/brand";
import {
  CAMPAIGN_SETUP_CODE,
  NEW_PASSWORD_REQUIREMENT_COPY,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ActivationStep = "enter-code" | "password";

export default function CoachLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/coach/dashboard";

  const [loading, setLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationStep, setActivationStep] =
    useState<ActivationStep>("enter-code");
  const [actEmail, setActEmail] = useState("");
  const [actCode, setActCode] = useState("");
  const [actPassword, setActPassword] = useState("");
  const [actPasswordConfirm, setActPasswordConfirm] = useState("");
  const [existingAccountMode, setExistingAccountMode] = useState(false);

  async function onSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSignInError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
    });
    setLoading(false);
    if (signErr) {
      setSignInError(signErr.message);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setActivationError(null);
    setLoading(true);
    const res = await verifyAndSetCoachActivationCookie(
      actEmail,
      normalizeFundraiserSetupCode(actCode)
    );
    setLoading(false);
    if (!res.ok) {
      setActivationError(res.error);
      return;
    }
    setActivationStep("password");
    setExistingAccountMode(false);
    setActPassword("");
    setActPasswordConfirm("");
  }

  async function onFinishActivation(e: React.FormEvent) {
    e.preventDefault();
    setActivationError(null);

    if (!existingAccountMode) {
      if (actPassword.length < 8) {
        setActivationError(NEW_PASSWORD_REQUIREMENT_COPY);
        return;
      }
      if (actPassword !== actPasswordConfirm) {
        setActivationError("Passwords do not match.");
        return;
      }
    } else if (actPassword.length < 1) {
      setActivationError("Enter your password.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    if (existingAccountMode) {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: actEmail.trim(),
        password: actPassword,
      });
      if (signErr) {
        setLoading(false);
        setActivationError(signErr.message);
        return;
      }
      const re = await verifyAndSetCoachActivationCookie(
        actEmail,
        normalizeFundraiserSetupCode(actCode)
      );
      if (!re.ok) {
        setLoading(false);
        setActivationError(re.error);
        return;
      }
      try {
        sessionStorage.setItem(
          "hh_pending_activation_email",
          actEmail.trim().toLowerCase()
        );
        sessionStorage.setItem(
          "hh_pending_activation_code",
          normalizeFundraiserSetupCode(actCode)
        );
      } catch {
        /* private mode */
      }
      setLoading(false);
      window.location.assign("/coach/new-fundraiser");
      return;
    }

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: actEmail.trim(),
      password: actPassword,
      options: {
        emailRedirectTo: `${origin}/coach/new-fundraiser`,
      },
    });

    if (signUpErr) {
      setLoading(false);
      const msg = signUpErr.message.toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        setExistingAccountMode(true);
        setActPassword("");
        setActPasswordConfirm("");
        setActivationError(
          "That email already has an account. Enter the password you created before, then we’ll take you to fundraiser setup."
        );
        return;
      }
      setActivationError(signUpErr.message);
      return;
    }

    if (data.session) {
      const re = await verifyAndSetCoachActivationCookie(
        actEmail,
        normalizeFundraiserSetupCode(actCode)
      );
      if (!re.ok) {
        setActivationError(re.error);
        setLoading(false);
        return;
      }
      try {
        sessionStorage.setItem(
          "hh_pending_activation_email",
          actEmail.trim().toLowerCase()
        );
        sessionStorage.setItem(
          "hh_pending_activation_code",
          normalizeFundraiserSetupCode(actCode)
        );
      } catch {
        /* private mode */
      }
      setLoading(false);
      window.location.assign("/coach/new-fundraiser");
      return;
    }

    setLoading(false);
    const { data: retry, error: signInAfter } =
      await supabase.auth.signInWithPassword({
        email: actEmail.trim(),
        password: actPassword,
      });
    if (!signInAfter && retry.session) {
      const re = await verifyAndSetCoachActivationCookie(
        actEmail,
        normalizeFundraiserSetupCode(actCode)
      );
      if (!re.ok) {
        setActivationError(re.error);
        return;
      }
      try {
        sessionStorage.setItem(
          "hh_pending_activation_email",
          actEmail.trim().toLowerCase()
        );
        sessionStorage.setItem(
          "hh_pending_activation_code",
          normalizeFundraiserSetupCode(actCode)
        );
      } catch {
        /* private mode */
      }
      window.location.assign("/coach/new-fundraiser");
      return;
    }
    setActivationError(
      signInAfter?.message ??
        "Could not continue. Use the Returning Organizer tab to sign in with this email and password."
    );
  }

  function resetActivationFlow() {
    setActivationStep("enter-code");
    setExistingAccountMode(false);
    setActPassword("");
    setActPasswordConfirm("");
    setActivationError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md border-hh-dark/10">
        <CardHeader>
          <CardTitle className="text-hh-dark">Organizer portal</CardTitle>
          <CardDescription>{BRAND.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="returning" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="returning">Returning Organizer</TabsTrigger>
              <TabsTrigger value="code">Start with my code</TabsTrigger>
            </TabsList>

            <TabsContent value="returning" className="mt-4 space-y-4">
              <p className="text-sm text-slate-600">
                Use the email and password you created the first time you used
                your fundraiser code.
              </p>
              <form className="space-y-4" onSubmit={onSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <p className="-mt-1 text-right text-sm">
                  <Link
                    href="/coach/forgot-password"
                    className="text-hh-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </p>
                {signInError ? (
                  <p className="text-sm text-red-600" role="alert">
                    {signInError}
                  </p>
                ) : null}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="code" className="mt-4 space-y-4">
              {activationStep === "enter-code" ? (
                <>
                  <p className="text-sm text-slate-600">
                    Enter the <strong>same email</strong> Heart & Hustle used when
                    they sent your HH fundraiser code, then paste the code. Next
                    you&apos;ll create a password and set up your campaign.
                  </p>
                  <form className="space-y-4" onSubmit={onVerifyCode}>
                    <div className="space-y-2">
                      <Label htmlFor="act-email">Email</Label>
                      <Input
                        id="act-email"
                        type="email"
                        autoComplete="email"
                        value={actEmail}
                        onChange={(e) => setActEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="act-code">Fundraiser code</Label>
                      <Input
                        id="act-code"
                        value={actCode}
                        onChange={(e) => setActCode(e.target.value)}
                        onBlur={() =>
                          setActCode((c) =>
                            c.trim()
                              ? normalizeFundraiserSetupCode(c)
                              : c
                          )
                        }
                        placeholder="HH-XXXX-XXXX"
                        className="font-mono"
                        autoComplete="off"
                        required
                      />
                      <p className="text-xs leading-relaxed text-slate-500">
                        {CAMPAIGN_SETUP_CODE.inputFormatHint}
                      </p>
                    </div>
                    {activationError ? (
                      <p className="text-sm text-red-600" role="alert">
                        {activationError}
                      </p>
                    ) : null}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Checking…" : "Continue"}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600">
                    {existingAccountMode
                      ? "Sign in with your existing password to continue to fundraiser setup."
                      : "Create a password you’ll use every time you return to the Organizer portal."}
                  </p>
                  {!existingAccountMode ? (
                    <p className="text-xs leading-relaxed text-slate-500">
                      {NEW_PASSWORD_REQUIREMENT_COPY}
                    </p>
                  ) : null}
                  <form className="space-y-4" onSubmit={onFinishActivation}>
                    <div className="space-y-2">
                      <Label htmlFor="act-pw">Password</Label>
                      <Input
                        id="act-pw"
                        type="password"
                        autoComplete={
                          existingAccountMode
                            ? "current-password"
                            : "new-password"
                        }
                        value={actPassword}
                        onChange={(e) => setActPassword(e.target.value)}
                        minLength={existingAccountMode ? undefined : 8}
                        required
                      />
                    </div>
                    {!existingAccountMode ? (
                      <div className="space-y-2">
                        <Label htmlFor="act-pw2">Confirm password</Label>
                        <Input
                          id="act-pw2"
                          type="password"
                          autoComplete="new-password"
                          value={actPasswordConfirm}
                          onChange={(e) => setActPasswordConfirm(e.target.value)}
                          minLength={8}
                          required
                        />
                      </div>
                    ) : null}
                    {activationError ? (
                      <p className="text-sm text-red-600" role="alert">
                        {activationError}
                      </p>
                    ) : null}
                    <div className="flex flex-col gap-2">
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading
                          ? "Working…"
                          : existingAccountMode
                            ? "Sign in & continue"
                            : "Create password & continue"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-slate-600"
                        onClick={resetActivationFlow}
                      >
                        Back to email & code
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </TabsContent>
          </Tabs>

          <p className="mt-2 text-center text-sm">
            <Link href="/" className="text-slate-500 hover:underline">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
