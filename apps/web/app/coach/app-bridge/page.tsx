"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CoachAppBridgePage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const hash =
      typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setMessage(
        "Open the coach dashboard from the Heart & Hustle app after you sign in."
      );
      return;
    }

    const supabase = createClient();
    void supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => {
        window.history.replaceState(null, "", window.location.pathname);
        if (error) {
          setMessage(error.message);
          return;
        }
        router.replace("/coach/dashboard");
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <p className="max-w-sm text-slate-600">{message}</p>
    </div>
  );
}
