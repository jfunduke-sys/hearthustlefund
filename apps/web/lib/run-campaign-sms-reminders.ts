import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  getTodayYmdCentral,
  shouldSendCampaignReminderSms,
} from "./campaign-sms-schedule";
import { createAdminClient } from "./supabase/admin";
import { normalizeUsToE164 } from "./sms-phone";
import { sendTwilioSms } from "./twilio-send-sms";

export type CampaignSmsRunResult = {
  fundraisersScanned: number;
  athleteSmsSent: number;
  coachSmsSent: number;
  skippedNoPhone: number;
  skippedNotScheduledDay: number;
  errors: string[];
};

function smsPhoneFromUser(user: User): string | null {
  const meta = user.user_metadata as {
    sms_phone?: string;
    sms_reminders_opt_in?: boolean;
  } | undefined;
  /** Explicit opt-out at signup — never send. */
  if (meta?.sms_reminders_opt_in === false) return null;

  const raw =
    typeof meta?.sms_phone === "string" && meta.sms_phone.trim()
      ? meta.sms_phone.trim()
      : user.phone?.trim() || null;
  return normalizeUsToE164(raw);
}

function buildAthleteBody(teamName: string, pending: number): string {
  const shortTeam =
    teamName.length > 36 ? `${teamName.slice(0, 33)}…` : teamName;
  if (pending > 0) {
    const p = pending > 99 ? "99+" : String(pending);
    return `H&H: ${p} awaiting donation — open app, Send reminders. ${shortTeam}`;
  }
  return `H&H: Resend your link (${shortTeam}) — open the app to text supporters.`;
}

function buildCoachBody(teamName: string): string {
  const shortTeam =
    teamName.length > 40 ? `${teamName.slice(0, 37)}…` : teamName;
  return `H&H Coach: Follow up with ${shortTeam} on donor texts today.`;
}

async function resolveCoachNotifyPhone(
  admin: SupabaseClient,
  codeUsed: string | null,
  coachId: string | null
): Promise<string | null> {
  if (codeUsed) {
    const { data: fc } = await admin
      .from("fundraiser_codes")
      .select("school_request_id")
      .eq("code", codeUsed)
      .maybeSingle();
    if (fc?.school_request_id) {
      const { data: sr } = await admin
        .from("school_requests")
        .select("admin_phone")
        .eq("id", fc.school_request_id)
        .maybeSingle();
      const p = sr?.admin_phone?.trim();
      if (p) return p;
    }
  }
  if (coachId) {
    const { data: uwrap } = await admin.auth.admin.getUserById(coachId);
    const u = uwrap?.user;
    if (u) {
      const fromUser = smsPhoneFromUser(u);
      if (fromUser) return fromUser;
    }
  }
  return null;
}

export async function runCampaignSmsReminders(): Promise<CampaignSmsRunResult> {
  const result: CampaignSmsRunResult = {
    fundraisersScanned: 0,
    athleteSmsSent: 0,
    coachSmsSent: 0,
    skippedNoPhone: 0,
    skippedNotScheduledDay: 0,
    errors: [],
  };

  const admin = createAdminClient();
  const todayYmd = getTodayYmdCentral();

  const { data: fundraisers, error: frErr } = await admin
    .from("fundraisers")
    .select("id, coach_id, team_name, start_date, end_date, status, code_used")
    .eq("status", "active");

  if (frErr) {
    result.errors.push(`fundraisers: ${frErr.message}`);
    return result;
  }

  for (const fr of fundraisers ?? []) {
    result.fundraisersScanned += 1;
    const start = String(fr.start_date);
    const end = String(fr.end_date);

    if (!shouldSendCampaignReminderSms(start, end, todayYmd)) {
      result.skippedNotScheduledDay += 1;
      continue;
    }

    const sentPhones = new Set<string>();

    const { data: athletes } = await admin
      .from("athletes")
      .select("id, user_id")
      .eq("fundraiser_id", fr.id);

    for (const a of athletes ?? []) {
      if (!a.user_id) continue;

      const { data: uwrap, error: uErr } = await admin.auth.admin.getUserById(
        a.user_id
      );
      if (uErr || !uwrap?.user) {
        result.skippedNoPhone += 1;
        continue;
      }
      const phone = smsPhoneFromUser(uwrap.user);
      if (!phone) {
        result.skippedNoPhone += 1;
        continue;
      }

      if (sentPhones.has(phone)) continue;

      const { count, error: cErr } = await admin
        .from("athlete_contacts")
        .select("*", { count: "exact", head: true })
        .eq("athlete_id", a.id)
        .eq("donated", false)
        .not("texted_at", "is", null);

      const pending = !cErr && count != null ? count : 0;
      const body = buildAthleteBody(fr.team_name, pending);

      try {
        await sendTwilioSms(phone, body);
        result.athleteSmsSent += 1;
        sentPhones.add(phone);
      } catch (e) {
        result.errors.push(
          `athlete ${a.id}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    const coachRaw = await resolveCoachNotifyPhone(
      admin,
      fr.code_used,
      fr.coach_id
    );
    const coachPhone = coachRaw ? normalizeUsToE164(coachRaw) : null;
    if (coachPhone && !sentPhones.has(coachPhone)) {
      try {
        await sendTwilioSms(coachPhone, buildCoachBody(fr.team_name));
        result.coachSmsSent += 1;
        sentPhones.add(coachPhone);
      } catch (e) {
        result.errors.push(
          `coach ${fr.id}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
  }

  return result;
}
