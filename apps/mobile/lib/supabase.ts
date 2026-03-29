import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** False in dev if .env is missing — RLS queries will fail silently otherwise. */
export function hasSupabaseConfig(): boolean {
  return Boolean(supabaseUrl.trim() && supabaseAnonKey.trim());
}

/**
 * AsyncStorage is required on React Native so the session (and JWT for RLS)
 * persist and attach to database requests. Without it, sign-in can "work" but
 * `athletes` queries return empty under RLS.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function getApiBase() {
  return (
    process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

export function donateUrl(token: string) {
  return `${getApiBase()}/donate/${token}`;
}
