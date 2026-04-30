import { PLATFORM } from "./platform";

/**
 * Version bump when disclosure text changes (stored in user_metadata for audit).
 */
export const SMS_REMINDER_CONSENT_VERSION = "2026-04";

/**
 * Checkbox / legal disclosure body (no HTML). Pair with links to /terms, /privacy,
 * and the SMS program page in UI; the full program agreement is not a public URL.
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

/**
 * Plain-text narrative for Twilio / 10DLC “Message Flow” fields. Paste as-is after
 * replacing BASE_URL with your production site (e.g. https://hearthustlefund.com).
 * Must stay consistent with `/sms-reminders` and in-app consent UI.
 */
export const SMS_REMINDER_A2P_MESSAGE_FLOW_TEMPLATE = `Automated fundraising REMINDER texts (from ${PLATFORM.displayName} / Twilio) — how users opt in

WHO RECEIVES THESE MESSAGES
Only users who saved a U.S. mobile number and checked the consent box in the ${PLATFORM.shortName} mobile app (same account may also use the website). We do not purchase or import phone lists.

OPT-IN PATH (step by step)
1) User downloads the ${PLATFORM.shortName} mobile app and joins a team using the 7-character team code from their coach.
2) User creates an account (email + password).
3) In the app Dashboard under "Your Contact Info," the user may optionally enter a 10-digit U.S. mobile number for campaign reminders.
4) Before saving, the user must check a consent box. The exact disclosure text is versioned and shown on our public program page (see links below). Saving the number without checking the box is not allowed when opting in to reminders.
5) Reminders are sent only while the user’s fundraiser campaign is ACTIVE (between published start and end dates). Approximate frequency: about every three (3) days during the campaign, plus one message on the last campaign day. These are operational reminders to support an existing fundraiser the user joined — not third‑party marketing.

PUBLIC DISCLOSURES (reviewer-accessible)
Replace BASE_URL with our live website, then verify these URLs load without login:
- Program description + consent wording mirror: BASE_URL${SMS_REMINDER_PUBLIC_INFO_PATH}
- Terms of service: BASE_URL/terms
- Privacy policy: BASE_URL/privacy

OPT‑OUT AND HELP
- Reply STOP to cancel further reminder texts from us.
- Reply HELP for supported help wording.
- User may also turn off reminders in the app by removing consent / clearing the saved reminder number in account settings as described on the program page above.

OTHER MESSAGES (participant-initiated, separate from automated reminders)
Participants may compose and send fundraising texts manually from their own device to contacts they choose. Those are user-initiated; this campaign registration covers only automated reminder texts sent by the platform/Twilio on the schedule above.`;

