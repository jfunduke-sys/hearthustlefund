import twilio from "twilio";

export async function sendTwilioSms(toE164: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) {
    throw new Error("Twilio is not configured (TWILIO_* env vars).");
  }
  const client = twilio(sid, token);
  await client.messages.create({ to: toE164, from, body });
}
