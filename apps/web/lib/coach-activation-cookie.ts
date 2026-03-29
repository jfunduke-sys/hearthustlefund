import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "hh_coach_activation";

export { COOKIE_NAME };

type Payload = {
  email: string;
  code: string;
  exp: number;
};

function signingSecret() {
  const s =
    process.env.COACH_ACTIVATION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) {
    throw new Error(
      "COACH_ACTIVATION_SECRET or SUPABASE_SERVICE_ROLE_KEY is required for coach code activation"
    );
  }
  return s;
}

export function signCoachActivationToken(p: Payload): string {
  const payload = Buffer.from(JSON.stringify(p)).toString("base64url");
  const sig = createHmac("sha256", signingSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyCoachActivationToken(
  value: string | undefined
): { email: string; code: string } | null {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot < 1) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", signingSecret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Payload;
    if (typeof p.email !== "string" || typeof p.code !== "string") return null;
    if (typeof p.exp !== "number" || Date.now() > p.exp) return null;
    return { email: p.email.toLowerCase().trim(), code: p.code.trim() };
  } catch {
    return null;
  }
}
