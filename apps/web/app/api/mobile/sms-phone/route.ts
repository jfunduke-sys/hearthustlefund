import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUsToE164 } from "@/lib/sms-phone";

export const dynamic = "force-dynamic";

/**
 * Save US mobile number for Twilio campaign reminders (user_metadata.sms_phone).
 * POST JSON: { "phone": "+1… or 10 digits" }
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

  let body: { phone?: string };
  try {
    body = (await request.json()) as { phone?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const normalized = normalizeUsToE164(body.phone ?? "");
  if (!normalized) {
    return NextResponse.json(
      { error: "Enter a valid US mobile number (10 digits)." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...meta,
      sms_phone: normalized,
      sms_reminders_opt_in: true,
    },
  });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phone: normalized });
}
