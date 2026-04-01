"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeFundraiserSetupCode } from "@heart-and-hustle/shared";
import {
  COOKIE_NAME,
  signCoachActivationToken,
} from "@/lib/coach-activation-cookie";

const ACTIVATION_TTL_SEC = 30 * 60;

export type VerifyCoachCodeResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyAndSetCoachActivationCookie(
  emailRaw: string,
  codeRaw: string
): Promise<VerifyCoachCodeResult> {
  const email = emailRaw.toLowerCase().trim();
  const code = normalizeFundraiserSetupCode(codeRaw);
  if (!email || !code) {
    return { ok: false, error: "Enter the email and fundraiser code you received." };
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("fundraiser_codes")
    .select("code, assigned_to_email, used, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: "That fundraiser code was not found." };
  }
  if (row.used) {
    return {
      ok: false,
      error:
        "This code has already been used. Sign in with your email and password, then open your dashboard.",
    };
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { ok: false, error: "This code has expired. Contact Heart & Hustle for a new one." };
  }
  const assigned = row.assigned_to_email?.trim().toLowerCase();
  if (!assigned) {
    return {
      ok: false,
      error:
        "This code is not assigned to a coach email. Contact Heart & Hustle support.",
    };
  }
  if (assigned !== email) {
    return {
      ok: false,
      error:
        "Use the same email address Heart & Hustle sent the code to—usually the lead coach or fundraiser contact.",
    };
  }

  const exp = Date.now() + ACTIVATION_TTL_SEC * 1000;
  const token = signCoachActivationToken({ email, code, exp });

  const jar = cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACTIVATION_TTL_SEC,
    path: "/",
  });

  return { ok: true };
}

export async function clearCoachActivationCookie() {
  cookies().delete(COOKIE_NAME);
}
