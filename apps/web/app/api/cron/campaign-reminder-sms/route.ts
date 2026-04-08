import { NextResponse } from "next/server";
import { runCampaignSmsReminders } from "@/lib/run-campaign-sms-reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Daily cron: Twilio SMS to athletes/coaches on every 3rd campaign day + last day (Central Time).
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
    const result = await runCampaignSmsReminders();
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
