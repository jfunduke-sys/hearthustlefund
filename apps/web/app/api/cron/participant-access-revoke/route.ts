import { NextResponse } from "next/server";
import { runParticipantAccessRevoke } from "@/lib/run-participant-access-revoke";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Daily cron: ~24h after campaign end_date (Central calendar grace), revoke
 * participant auth for still-active fundraisers if SuperAdmin has not closed out.
 * Secure with Authorization: Bearer CRON_SECRET (Vercel Cron or manual).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runParticipantAccessRevoke();
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
