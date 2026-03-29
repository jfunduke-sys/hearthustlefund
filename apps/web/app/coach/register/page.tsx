"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/brand";
import { NEW_PASSWORD_REQUIREMENT_COPY } from "@heart-and-hustle/shared";
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

export default function CoachRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    if (password.length < 8) {
      setError(NEW_PASSWORD_REQUIREMENT_COPY);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/coach/dashboard` },
    });
    setLoading(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    setInfo(
      "Check your email to confirm your account (if required by your Supabase project), then sign in."
    );
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md border-hh-dark/10">
        <CardHeader>
          <CardTitle className="text-hh-dark">Coach registration</CardTitle>
          <CardDescription>{BRAND.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg border border-hh-primary/20 bg-hh-primary/5 px-3 py-2 text-sm text-slate-700">
            <strong className="text-hh-dark">Have a fundraiser code?</strong> Use{" "}
            <Link href="/coach/login" className="font-medium text-hh-primary underline">
              Coach login
            </Link>{" "}
            → <strong>Start with my code</strong> so you can enter your email,
            code, and password in one flow—then build your campaign.
          </div>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
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
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            {info ? (
              <p className="text-sm text-emerald-800" role="status">
                {info}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create coach account"}
            </Button>
            <p className="text-center text-sm text-slate-600">
              Already registered?{" "}
              <Link
                href="/coach/login"
                className="font-medium text-hh-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
