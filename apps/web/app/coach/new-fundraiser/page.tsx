import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
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
  }

  return <NewFundraiserClient initialCode={initialCode} />;
}
