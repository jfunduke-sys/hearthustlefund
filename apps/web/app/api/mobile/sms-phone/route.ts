import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SMS_REMINDER_CONSENT_VERSION } from "@heart-and-hustle/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUsToE164 } from "@/lib/sms-phone";

export const dynamic = "force-dynamic";

type PostBody = {
  phone?: string | null;
  smsRemindersOptIn?: boolean;
};

/**
 * Save or clear US mobile for Twilio campaign reminders (user_metadata).
 * Opt-in requires explicit smsRemindersOptIn: true plus a valid phone.
 * Opt-out: smsRemindersOptIn: false (clears stored number and consent).
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization bearer token." },
      { status: 401 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { error: "Server Supabase configuration is incomplete." },
      { status: 500 }
    );
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json(
      { error: "Invalid or expired session." },
      { status: 401 }
    );
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (typeof body.smsRemindersOptIn !== "boolean") {
    return NextResponse.json(
      {
        error:
          "Send smsRemindersOptIn: true with a valid phone to opt in, or false to turn off SMS reminders.",
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();

  if (body.smsRemindersOptIn === false) {
    const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        sms_reminders_opt_in: false,
        sms_phone: null,
        sms_consent_cleared_at: now,
      },
    });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, optedOut: true });
  }

  const normalized = normalizeUsToE164(String(body.phone ?? ""));
  if (!normalized) {
    return NextResponse.json(
      { error: "Enter a valid US mobile number (10 digits)." },
      { status: 400 }
    );
  }

  const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...meta,
      sms_phone: normalized,
      sms_reminders_opt_in: true,
      sms_consent_at: now,
      sms_consent_version: SMS_REMINDER_CONSENT_VERSION,
    },
  });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phone: normalized });
}
