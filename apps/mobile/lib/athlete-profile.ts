import { getApiBase, supabase } from "./supabase";

type AthleteRow = Record<string, unknown> & {
  id: string;
  fundraiser_id: string;
};

/**
 * Loads the newest athlete row for this auth user. Retries with backoff so the
 * JWT from AsyncStorage is attached to PostgREST after sign-in (RN timing).
 */
export async function fetchLatestAthleteForUser(
  userId: string
): Promise<{ athlete: AthleteRow | null; queryError: string | null }> {
  // Do not call refreshSession() here — it races with the session right after
  // sign-in and can invalidate the refresh token on React Native.

  const delaysMs = [0, 200, 450, 700, 1100, 1600];
  let lastErr: string | null = null;

  for (let i = 0; i < delaysMs.length; i++) {
    if (delaysMs[i]! > 0) {
      await new Promise((r) => setTimeout(r, delaysMs[i]));
    }

    const { data, error } = await supabase
      .from("athletes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      lastErr = error.message;
      if (__DEV__) {
        console.warn("[athletes]", error.message, error);
      }
      continue;
    }

    const row = data?.[0] as AthleteRow | undefined;
    if (row) {
      return { athlete: row, queryError: null };
    }
  }

  return { athlete: null, queryError: lastErr };
}

/**
 * Fallback: Next.js API verifies the JWT and reads `athletes` with the service role.
 * Requires EXPO_PUBLIC_API_URL to point at the web app (e.g. http://localhost:3000).
 */
export async function fetchAthleteViaWebApi(
  accessToken: string
): Promise<{ athlete: AthleteRow | null; error: string | null }> {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/mobile/athlete-profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = (await res.json()) as {
      athlete?: AthleteRow | null;
      error?: string;
    };
    if (!res.ok) {
      return {
        athlete: null,
        error: json.error ?? `Request failed (${res.status})`,
      };
    }
    return { athlete: json.athlete ?? null, error: null };
  } catch (e: unknown) {
    return {
      athlete: null,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

/** Saves US mobile for Twilio campaign reminders (server stores user_metadata.sms_phone). */
export async function saveSmsPhoneViaWebApi(
  accessToken: string,
  phone: string
): Promise<{ ok: true; phone: string } | { ok: false; error: string }> {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/mobile/sms-phone`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      phone?: string;
      error?: string;
    };
    if (!res.ok || !json.ok || !json.phone) {
      return { ok: false, error: json.error ?? `Request failed (${res.status})` };
    }
    return { ok: true, phone: json.phone };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}
