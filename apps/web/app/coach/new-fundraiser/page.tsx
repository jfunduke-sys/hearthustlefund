import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeFundraiserSetupCode } from "@heart-and-hustle/shared";
import {
  COOKIE_NAME,
  verifyCoachActivationToken,
} from "@/lib/coach-activation-cookie";
import NewFundraiserClient from "./new-fundraiser-client";

export default async function NewFundraiserPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const raw = cookies().get(COOKIE_NAME)?.value;
  const act = verifyCoachActivationToken(raw);
  let initialCode: string | null = null;
  if (
    user?.email &&
    act &&
    user.email.toLowerCase().trim() === act.email
  ) {
    initialCode = act.code;
    const codeNorm = normalizeFundraiserSetupCode(act.code);
    if (codeNorm) {
      const admin = createAdminClient();
      const { data: fr } = await admin
        .from("fundraisers")
        .select("id")
        .eq("coach_id", user.id)
        .eq("code_used", codeNorm)
        .maybeSingle();
      if (fr) {
        redirect("/coach/dashboard");
      }
    }
  }

  return <NewFundraiserClient initialCode={initialCode} />;
}
