import { createClient } from "@/lib/supabase/client";
import { createRecoveryClient } from "@/lib/supabase/recovery-client";

const SESSION_MISSING =
  "This reset link is invalid or was already used. Request a new reset link.";

export type PasswordRecoveryClient =
  | ReturnType<typeof createClient>
  | ReturnType<typeof createRecoveryClient>;

function cleanUrl() {
  window.history.replaceState({}, "", window.location.pathname);
}

/**
 * Turns the email reset link into a short-lived session so we can set a new
 * password. Works on a different phone or computer than the one that requested
 * the email (hash tokens, token_hash, or a session cookie from /auth/confirm).
 */
export async function establishPasswordRecoverySession(): Promise<
  | { ok: true; supabase: PasswordRecoveryClient }
  | { ok: false; error: string }
> {
  const url = new URL(window.location.href);
  if (url.searchParams.get("reset") === "invalid") {
    return { ok: false, error: SESSION_MISSING };
  }

  const cookieClient = createClient();
  const {
    data: { session: cookieSession },
  } = await cookieClient.auth.getSession();
  if (cookieSession) {
    return { ok: true, supabase: cookieClient };
  }

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await cookieClient.auth.exchangeCodeForSession(code);
    if (!error) {
      cleanUrl();
      return { ok: true, supabase: cookieClient };
    }
  }

  const supabase = createRecoveryClient();
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const hashParams = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash
  );
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return { ok: false, error: SESSION_MISSING };
    cleanUrl();
  } else if (tokenHash && (type === "recovery" || type === "magiclink")) {
    const { error } = await supabase.auth.verifyOtp({
      type: type === "magiclink" ? "magiclink" : "recovery",
      token_hash: tokenHash,
    });
    if (error) return { ok: false, error: SESSION_MISSING };
    cleanUrl();
  } else {
    const {
      data: { session: implicitSession },
    } = await supabase.auth.getSession();
    if (!implicitSession) return { ok: false, error: SESSION_MISSING };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: SESSION_MISSING };
  return { ok: true, supabase };
}
