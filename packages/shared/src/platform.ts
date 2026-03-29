import { NEW_PASSWORD_REQUIREMENT_COPY } from "./auth-copy";

/**
 * Single source of truth for product naming and how the two access paths work.
 * Use these strings everywhere (web, mobile, SMS) so the story stays consistent.
 */
export const PLATFORM = {
  displayName: "Heart & Hustle Fundraising",
  shortName: "Heart & Hustle",
} as const;

/** Creates the campaign in the coach portal. Tied to one coach email. Not used to join as a participant. */
export const CAMPAIGN_SETUP_CODE = {
  label: "Campaign setup code",
  /** Full explanation (e.g. legal/admin copy). Participant-facing UI should use `joinFlowReminder` for parity with mobile. */
  description:
    "The HH-XXXX-XXXX code from Heart & Hustle is only for the designated coach to create the fundraiser in the coach portal. It is not the team join link.",
  /** One line on participant join flows (app/web) — same meaning as `description`. */
  joinFlowReminder:
    "The HH-… campaign setup code is only for creating the fundraiser in the coach portal—not for joining here.",
} as const;

/** Anyone with this can register as a participant (one row in `athletes`). Athletes, assistant coaches, parents helping text—same flow, same data model. */
export const TEAM_JOIN = {
  label: "Team join code",
  description:
    `Your coach shares a 7-character team code. Open the Heart & Hustle app, enter the code, then create your email and password to get your personal donation link and texting tools. ${NEW_PASSWORD_REQUIREMENT_COPY}`,
  slugHelp:
    "In the mobile app, enter the 7-character code from your coach. (That’s different from the HH campaign setup code coaches use on the website.)",
} as const;

export type FundraisingSmsParams = {
  athleteFullName: string;
  teamName: string;
  schoolName: string;
  donateUrl: string;
};

function firstNameFromFullName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "I";
  return t.split(/\s+/)[0] ?? t;
}

/** Initial fundraising text — keep in sync across mobile + web coach participant tools. */
export function buildInitialFundraisingSms(p: FundraisingSmsParams) {
  const athleteFirst = firstNameFromFullName(p.athleteFullName);

  return `Hey, it's ${athleteFirst}! I'm participating in a fundraiser for ${p.teamName} at ${p.schoolName} and would love your support. Every donation goes directly to our program — click my personal link to contribute: ${p.donateUrl} Thank you so much, it really means a lot!`;
}

export type ReminderSmsParams = {
  contactFirstName: string;
  teamName: string;
  donateUrl: string;
};

export function buildReminderSms(p: ReminderSmsParams) {
  return `Hey ${p.contactFirstName}, just a friendly reminder! I'm still fundraising for ${p.teamName} with ${PLATFORM.shortName}. Every donation helps!

👉 ${p.donateUrl}

Thanks for considering it! ❤`;
}
