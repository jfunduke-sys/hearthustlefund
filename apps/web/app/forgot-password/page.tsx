"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSent(false);
    setLoading(true);
    try {
      const supabase = createClient();
      const configuredBase = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectBase = configuredBase || origin;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${redirectBase}/reset-password`,
        }
      );
      if (resetErr) {
        setError(resetErr.message);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md border-hh-dark/10">
        <CardHeader>
          <CardTitle className="text-hh-dark">Reset your password</CardTitle>
          <p className="text-sm text-slate-600">{BRAND.name}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Enter your account email and we&apos;ll send a secure reset link.
          </p>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            {sent ? (
              <p className="text-sm text-emerald-700">
                If that email is registered, a reset link has been sent.
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-600">
            <Link href="/coach/login" className="text-hh-primary hover:underline">
              Organizer login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
