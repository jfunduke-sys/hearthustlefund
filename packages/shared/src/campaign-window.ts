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
