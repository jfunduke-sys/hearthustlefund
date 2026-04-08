/**
 * Campaign dates and “today” use America/Chicago (same as fundraising rules elsewhere).
 */
export function getTodayYmdCentral(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

/** Inclusive calendar distance: same day → 0, next day → 1 */
export function calendarDaysBetweenStartAndDate(
  startYmd: string,
  endYmd: string
): number {
  const [sy, sm, sd] = startYmd.split("-").map(Number);
  const [ey, em, ed] = endYmd.split("-").map(Number);
  const S = Date.UTC(sy, sm - 1, sd);
  const E = Date.UTC(ey, em - 1, ed);
  return Math.round((E - S) / 86400000);
}

/**
 * Day index within campaign: start date = day 1.
 */
export function campaignDayIndex(startYmd: string, todayYmd: string): number {
  return calendarDaysBetweenStartAndDate(startYmd, todayYmd) + 1;
}

/**
 * Send on: every 3rd campaign day (3, 6, 9, …), and always on the last day.
 */
export function shouldSendCampaignReminderSms(
  startYmd: string,
  endYmd: string,
  todayYmd: string
): boolean {
  if (todayYmd < startYmd || todayYmd > endYmd) return false;
  if (todayYmd === endYmd) return true;
  const idx = campaignDayIndex(startYmd, todayYmd);
  if (idx < 1) return false;
  return idx % 3 === 0;
}
