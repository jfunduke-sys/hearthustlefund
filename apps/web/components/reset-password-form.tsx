"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NEW_PASSWORD_REQUIREMENT_COPY } from "@heart-and-hustle/shared";
import { BRAND } from "@/lib/brand";
import {
  establishPasswordRecoverySession,
  type PasswordRecoveryClient,
} from "@/lib/auth-recovery-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  title: string;
  loginHref: string;
  forgotHref: string;
  successMessage: string;
};

export function ResetPasswordForm({
  title,
  loginHref,
  forgotHref,
  successMessage,
}: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [supabase, setSupabase] = useState<PasswordRecoveryClient | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await establishPasswordRecoverySession();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setReady(false);
        return;
      }
      setSupabase(result.supabase);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const passwordError = useMemo(() => {
    if (!password) return null;
    if (password.length < 8) return NEW_PASSWORD_REQUIREMENT_COPY;
    if (confirmPassword && password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  }, [password, confirmPassword]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (password.length < 8) {
      setError(NEW_PASSWORD_REQUIREMENT_COPY);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!supabase) {
      setError(
        "This reset link is invalid or was already used. Request a new reset link."
      );
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(
          `${updateErr.message}. If your link expired, request a new reset link.`
        );
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.replace(loginHref);
        router.refresh();
      }, 900);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md border-hh-dark/10">
        <CardHeader>
          <CardTitle className="text-hh-dark">{title}</CardTitle>
          <p className="text-sm text-slate-600">{BRAND.name}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{NEW_PASSWORD_REQUIREMENT_COPY}</p>
          {!ready && !error ? (
            <p className="text-sm text-slate-600">Opening your reset link…</p>
          ) : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                disabled={!ready || loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
                disabled={!ready || loading}
              />
            </div>
            {passwordError ? (
              <p className="text-sm text-red-600">{passwordError}</p>
            ) : null}
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            {done ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={!ready || loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-600">
            <Link href={forgotHref} className="text-hh-primary hover:underline">
              Need a new reset link?
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
