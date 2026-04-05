import { formatDisplayDate } from "./format-date";

/**
 * Calendar used to decide if “today” is inside the fundraiser’s start/end dates.
 * Matches DB triggers (America/Chicago).
 */
export const CAMPAIGN_CALENDAR_TIME_ZONE = "America/Chicago";

/** `YYYY-MM-DD` in the given IANA timezone for `date`. */
export function calendarDateInTimeZone(
  date: Date,
  timeZone: string = CAMPAIGN_CALENDAR_TIME_ZONE
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeDateOnly(s: string): string {
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 10);
}

export type CampaignWindowPhase = "active" | "before_start" | "after_end";

export function getCampaignWindowPhase(
  startDateStr: string,
  endDateStr: string,
  now: Date = new Date(),
  timeZone: string = CAMPAIGN_CALENDAR_TIME_ZONE
): CampaignWindowPhase {
  const today = calendarDateInTimeZone(now, timeZone);
  const start = normalizeDateOnly(startDateStr);
  const end = normalizeDateOnly(endDateStr);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return "active";
  }
  if (today < start) return "before_start";
  if (today > end) return "after_end";
  return "active";
}

export function isCampaignWindowActiveForOutreach(
  startDateStr: string,
  endDateStr: string,
  now?: Date
): boolean {
  return getCampaignWindowPhase(startDateStr, endDateStr, now) === "active";
}

export function isCampaignWindowActiveForDonations(
  startDateStr: string,
  endDateStr: string,
  now?: Date
): boolean {
  return isCampaignWindowActiveForOutreach(startDateStr, endDateStr, now);
}

/** Whole calendar days between two YYYY-MM-DD strings (b − a). */
export function calendarDaysBetweenYMD(a: string, b: string): number {
  const na = normalizeDateOnly(a);
  const nb = normalizeDateOnly(b);
  const [ya, ma, da] = na.split("-").map(Number);
  const [yb, mb, db] = nb.split("-").map(Number);
  const ua = Date.UTC(ya, ma - 1, da);
  const ub = Date.UTC(yb, mb - 1, db);
  return Math.round((ub - ua) / 86400000);
}

export type CampaignDayBanner =
  | { phase: "before_start"; daysUntilStart: number }
  | { phase: "active"; daysLeft: number }
  | { phase: "after_end" };

/**
 * Banner copy for donate pages: days until start, days left (inclusive of end
 * date), or ended. Uses the same calendar zone as campaign enforcement.
 */
export function getCampaignDayBanner(
  startDateStr: string,
  endDateStr: string,
  now: Date = new Date(),
  timeZone: string = CAMPAIGN_CALENDAR_TIME_ZONE
): CampaignDayBanner | null {
  const today = calendarDateInTimeZone(now, timeZone);
  const s = normalizeDateOnly(startDateStr);
  const e = normalizeDateOnly(endDateStr);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) {
    return null;
  }
  if (today < s) {
    return {
      phase: "before_start",
      daysUntilStart: Math.max(0, calendarDaysBetweenYMD(today, s)),
    };
  }
  if (today > e) {
    return { phase: "after_end" };
  }
  const daysLeft = calendarDaysBetweenYMD(today, e) + 1;
  return { phase: "active", daysLeft: Math.max(1, daysLeft) };
}

export function campaignOutreachBlockedMessage(
  phase: CampaignWindowPhase,
  startDateStr: string,
  endDateStr: string
): string {
  if (phase === "before_start") {
    return `Texting opens on ${formatDisplayDate(startDateStr)} (campaign dates, Central Time). You can set up your profile and contacts anytime.`;
  }
  if (phase === "after_end") {
    return `This campaign ended on ${formatDisplayDate(endDateStr)}. Fundraising texts are no longer available.`;
  }
  return "";
}

/**
 * Athlete app dashboard (and related in-app notices): shorter pre-launch copy
 * without the parenthetical timezone line.
 */
export function athleteDashboardOutreachBannerMessage(
  phase: CampaignWindowPhase,
  startDateStr: string,
  endDateStr: string
): string {
  if (phase === "before_start") {
    return `Messages can be sent on ${formatDisplayDate(startDateStr)}. You can set up your profile and upload contacts anytime.`;
  }
  if (phase === "after_end") {
    return campaignOutreachBlockedMessage(phase, startDateStr, endDateStr);
  }
  return "";
}

export function campaignDonationsBlockedMessage(
  phase: CampaignWindowPhase,
  startDateStr: string,
  endDateStr: string
): string {
  if (phase === "before_start") {
    return `Online donations open on ${formatDisplayDate(startDateStr)}. Please check back during the campaign.`;
  }
  if (phase === "after_end") {
    return `This campaign closed on ${formatDisplayDate(endDateStr)}. We’re no longer accepting donations through this link.`;
  }
  return "";
}
