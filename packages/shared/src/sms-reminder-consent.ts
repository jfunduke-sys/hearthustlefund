import { PLATFORM } from "./platform";

/**
 * Version bump when disclosure text changes (stored in user_metadata for audit).
 */
export const SMS_REMINDER_CONSENT_VERSION = "2026-05";

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
Only users who optionally opt in separately from account signup: they save a U.S. mobile and check the standalone consent checkbox in the Heart & Hustle mobile app (Dashboard → "Your Contact Info"). We do not purchase or import phone lists.

SEPARATION FROM ACCOUNT / JOIN (required for carrier compliance)
Creating an account, joining a team, and fundraising do not require a mobile number or agreement to automated reminder SMS. Participants get full access without texts. Opting into reminders is a deliberate second step after the membership transaction succeeds.

OPT-IN PATH (step by step — verify at public URL below)
1) User downloads Heart & Hustle from the App Store (https://apps.apple.com/us/app/heart-hustle/id6763072369) or Google Play (https://play.google.com/store/apps/details?id=com.hearthustlefund.app).
2) User joins a team with the 7-character code from their coach and creates email + password. Signup has NO SMS checkbox and NO reminder phone field.
3) After login, user opens Dashboard → "Your Contact Info."
4) User optionally enters a U.S. mobile number, checks the unchecked-by-default consent checkbox (exact wording on program page), and taps Save. If they do not want texts, they skip this step.
5) Reminders are sent only while the user's fundraiser campaign is ACTIVE. Frequency: about every three (3) days during the campaign, plus one message on the last campaign day.

PUBLIC DISCLOSURES (reviewer-accessible — no login required)
Replace BASE_URL with https://www.hearthustlefund.com then verify these URLs load:
- Full opt-in workflow, consent wording, and in-app screen example: BASE_URL${SMS_REMINDER_PUBLIC_INFO_PATH}
- Terms of service: BASE_URL/terms
- Privacy policy: BASE_URL/privacy

MOBILE DATA: No mobile information obtained for SMS opt-in is shared with third parties or affiliates for marketing or promotional purposes.

OPT-OUT AND HELP
- Reply STOP to cancel further reminder texts from us.
- Reply HELP for help.
- User may also turn off reminders in the app under Your Contact Info.

OTHER MESSAGES (NOT part of this campaign)
Participants may compose fundraising texts manually from their own device to contacts they choose. Those are user-initiated; this campaign registration covers only automated reminder texts sent by the platform/Twilio on the schedule above.`;

