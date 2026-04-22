import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

/** Trimmed — trailing spaces/newlines from EAS paste break TLS host validation. */
export const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
export const supabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ""
).trim();

/** False in dev if .env is missing — RLS queries will fail silently otherwise. */
export function hasSupabaseConfig(): boolean {
  return Boolean(supabaseUrl.trim() && supabaseAnonKey.trim());
}

/**
 * EAS production builds do not read local `.env` unless you set the same keys
 * under Project → Environment variables. `createClient("", "")` throws at
 * import time ("supabaseUrl is required"), which crashes the app on launch.
 * Placeholders keep the bundle loadable; set real EXPO_PUBLIC_* on EAS for
 * TestFlight / store builds that actually talk to your backend.
 */
const supabaseUrlForClient =
  supabaseUrl.trim() || "https://__missing_config__.supabase.co";
const supabaseAnonKeyForClient =
  supabaseAnonKey.trim() || "__missing_EXPO_PUBLIC_SUPABASE_ANON_KEY__";

/**
 * AsyncStorage is required on React Native so the session (and JWT for RLS)
 * persist and attach to database requests. Without it, sign-in can "work" but
 * `athletes` queries return empty under RLS.
 */
export const supabase = createClient(
  supabaseUrlForClient,
  supabaseAnonKeyForClient,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export function getApiBase() {
  const raw = (process.env.EXPO_PUBLIC_API_URL ?? "").trim();
  return raw.replace(/\/$/, "") || "http://localhost:3000";
}

export function donateUrl(token: string) {
  return `${getApiBase()}/donate/${token}`;
}
