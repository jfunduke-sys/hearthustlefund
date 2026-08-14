import { createClient } from "@/lib/supabase/client";

const SESSION_MISSING =
  "This reset link is invalid or was already used. Request a new reset link and open it in the same browser you used to request it.";

/**
 * Password-reset emails land with `?code=` (PKCE). We must exchange that code
 * for a session before `updateUser({ password })` will work.
 */
export async function establishPasswordRecoverySession(): Promise<
  | { ok: true; supabase: ReturnType<typeof createClient> }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return { ok: false, error: SESSION_MISSING };
      }
    } else {
      window.history.replaceState({}, "", url.pathname);
    }
  } else if (tokenHash && (type === "recovery" || type === "magiclink")) {
    const { error } = await supabase.auth.verifyOtp({
      type: type === "magiclink" ? "magiclink" : "recovery",
      token_hash: tokenHash,
    });
    if (error) return { ok: false, error: SESSION_MISSING };
    window.history.replaceState({}, "", url.pathname);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: SESSION_MISSING };
  return { ok: true, supabase };
}
