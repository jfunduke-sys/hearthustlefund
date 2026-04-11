import { PLATFORM } from "./platform";

/**
 * Version bump when disclosure text changes (stored in user_metadata for audit).
 */
export const SMS_REMINDER_CONSENT_VERSION = "2026-04";

/**
 * Checkbox / legal disclosure body (no HTML). Pair with links to /terms and /privacy in UI.
 */
export const SMS_REMINDER_CONSENT_CHECKBOX_COPY =
  `I agree to receive automated fundraising reminder texts from ${PLATFORM.shortName} at this number during an active fundraiser (about every three days and on the last campaign day). Message and data rates may apply. Reply STOP to opt out, HELP for help.`;

/**
 * Short hint under phone fields when not using the full checkbox block.
 */
export const SMS_REMINDER_FREQUENCY_HINT =
  "Optional: reminder texts about every 3 days during the campaign plus the last day.";

/**
 * Public path on the marketing site (no trailing slash). Use with your base URL for Twilio / policies.
 */
export const SMS_REMINDER_PUBLIC_INFO_PATH = "/sms-reminders" as const;
