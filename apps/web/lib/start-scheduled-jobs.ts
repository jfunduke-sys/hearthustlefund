/**
 * Railway keeps the Next.js web service running 24/7. This starts lightweight
 * daily jobs in-process so we do not need Vercel Cron or a separate Railway
 * cron service. Safe to call once at server boot (instrumentation).
 *
 * Disable with ENABLE_IN_PROCESS_CRON=false.
 */
export function startScheduledJobs(): void {
  if (process.env.ENABLE_IN_PROCESS_CRON === "false") return;
  if (process.env.NODE_ENV !== "production") return;

  const g = globalThis as typeof globalThis & {
    __hhScheduledJobsStarted?: boolean;
  };
  if (g.__hhScheduledJobsStarted) return;
  g.__hhScheduledJobsStarted = true;

  const lastRunYmd: Record<string, string> = {};
  const INTERVAL_MS = 15 * 60 * 1000;

  const tick = async () => {
    const now = new Date();
    if (!isWithinDailyCronWindowCentral(now)) return;

    const today = chicagoYmd(now);

    if (lastRunYmd.sms !== today) {
      lastRunYmd.sms = today;
      try {
        const { runCampaignSmsReminders } = await import(
          "@/lib/run-campaign-sms-reminders"
        );
        const result = await runCampaignSmsReminders();
        console.info("[cron] campaign-reminder-sms", result);
      } catch (e) {
        lastRunYmd.sms = "";
        console.error("[cron] campaign-reminder-sms failed", e);
      }
    }

    if (lastRunYmd.revoke !== today) {
      lastRunYmd.revoke = today;
      try {
        const { runParticipantAccessRevoke } = await import(
          "@/lib/run-participant-access-revoke"
        );
        const result = await runParticipantAccessRevoke();
        console.info("[cron] participant-access-revoke", result);
      } catch (e) {
        lastRunYmd.revoke = "";
        console.error("[cron] participant-access-revoke failed", e);
      }
    }
  };

  console.info(
    "[cron] In-process daily jobs enabled (≈10 AM America/Chicago)."
  );
  void tick();
  setInterval(() => void tick(), INTERVAL_MS);
}

function chicagoYmd(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Run once per day during the 10 AM Central hour (matches prior cron intent). */
function isWithinDailyCronWindowCentral(now: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "-1");
  return hour === 10;
}
