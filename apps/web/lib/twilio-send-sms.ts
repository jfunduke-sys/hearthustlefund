import twilio from "twilio";

/**
 * Sends SMS. Prefer `TWILIO_MESSAGING_SERVICE_SID` (A2P 10DLC + Messaging Service)
 * so traffic uses your registered campaign; otherwise `TWILIO_FROM_NUMBER` + `from`.
 */
export async function sendTwilioSms(toE164: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token) {
    throw new Error("Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN).");
  }
  if (!messagingServiceSid && !from) {
    throw new Error(
      "Set TWILIO_MESSAGING_SERVICE_SID (recommended for A2P 10DLC) or TWILIO_FROM_NUMBER."
    );
  }
  const client = twilio(sid, token);
  if (messagingServiceSid) {
    await client.messages.create({
      messagingServiceSid,
      to: toE164,
      body,
    });
  } else {
    await client.messages.create({ to: toE164, from: from!, body });
  }
}
