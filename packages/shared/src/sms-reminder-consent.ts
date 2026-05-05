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
Only users who optionally opt in separately from account signup: they save a verified U.S. mobile and check the standalone consent checkbox in one of our opt-in flows (mobile app Dashboard → “Your Contact Info,” or—for internal testing only—the confirmation step after completing web signup). We do not purchase or import phone lists.

SEPARATION FROM ACCOUNT / JOIN (required for carrier compliance)
Creating an account, joining a team, and fundraising do not require a mobile number or agreement to automated reminder SMS. Participants get full access without texts. Opting into reminders is a deliberate second step after the membership transaction succeeds.

OPT-IN PATH (step by step)
1) User downloads the ${PLATFORM.shortName} mobile app and joins a team using the 7-character team code from their coach (and creates an email + password login), OR joins via limited web onboarding where offered.
2) Account creation collects name, email, password, team context only—no automated reminder SMS consent and no reminder phone on that same screen.
3) After the account exists, the user may optionally open Dashboard → “Your Contact Info” and enter a 10-digit U.S. mobile for campaign reminders. On the internal web join success page, the same optional step may appear only after “Create account & join” completes successfully.
4) To receive reminders, the user checks the consent box (exact wording is versioned on our public SMS program page below) and saves. If they do not want texts, they skip this step or leave the box unchecked—doing so does not affect their account.
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

