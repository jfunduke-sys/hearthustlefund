import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND } from "@/lib/brand";
import CoachDashboardClient from "./coach-dashboard-client";
import type { Athlete, Donation, Fundraiser } from "@heart-and-hustle/shared";
import { ensureFundraiserJoinCode } from "@/lib/join-code";
import { ensureCoachParticipantAthlete } from "@/app/actions/coach";

export default async function CoachDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/coach/login");

  const admin = createAdminClient();

  const { data: fundraisers } = await admin
    .from("fundraisers")
    .select("*")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const list = (fundraisers ?? []) as Fundraiser[];

  const activeRaw =
    list.find((f) => f.status === "active") ?? list[0] ?? null;

  if (!activeRaw) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-hh-dark">Coach dashboard</h1>
        <p className="mt-2 text-slate-600">
          You don&apos;t have a fundraiser yet. Create one with your approved
          code.
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-slate-500">
          If your HH code shows as already used but you see this message, you may
          be signed in with a <strong>different email</strong> than the one the
          code was assigned to. Sign out and use{" "}
          <strong>Returning coach</strong> with the same email you used when you
          first entered the code.
        </p>
        <Link
          href="/coach/new-fundraiser"
          className="mt-6 inline-block rounded-md bg-hh-primary px-4 py-2 text-white"
        >
          New fundraiser
        </Link>
        <p className="mt-8 text-sm text-slate-500">
          <Link href="/" className="underline">
            {BRAND.name}
          </Link>
        </p>
      </div>
    );
  }

  const joinCode = await ensureFundraiserJoinCode(
    admin,
    activeRaw.id,
    activeRaw.join_code
  );
  const active: Fundraiser = {
    ...activeRaw,
    join_code: joinCode,
  };

  try {
    await ensureCoachParticipantAthlete(active.id);
  } catch {
    /* best-effort: roster still loads if provisioning fails */
  }

  const { data: athletes } = await admin
    .from("athletes")
    .select("*")
    .eq("fundraiser_id", active.id);

  const { data: donations } = await admin
    .from("donations")
    .select("*")
    .eq("fundraiser_id", active.id)
    .order("created_at", { ascending: false });

  const athleteList = (athletes ?? []) as Athlete[];
  const donationList = (donations ?? []) as Donation[];
  const athleteIds = athleteList.map((a) => a.id);

  let contactRows: { athlete_id: string; texted_at: string | null }[] = [];
  if (athleteIds.length) {
    const { data: contacts } = await admin
      .from("athlete_contacts")
      .select("athlete_id, texted_at")
      .in("athlete_id", athleteIds);
    contactRows = contacts ?? [];
  }

  const textsByAthlete = new Map<string, number>();
  for (const c of contactRows) {
    if (!c.texted_at) continue;
    const n = textsByAthlete.get(c.athlete_id) ?? 0;
    textsByAthlete.set(c.athlete_id, n + 1);
  }

  const donationsByAthlete = new Map<string, number>();
  for (const d of donationList) {
    const n = donationsByAthlete.get(d.athlete_id) ?? 0;
    donationsByAthlete.set(d.athlete_id, n + 1);
  }

  const raisedByAthlete = new Map<string, number>();
  for (const d of donationList) {
    const sum = raisedByAthlete.get(d.athlete_id) ?? 0;
    raisedByAthlete.set(d.athlete_id, sum + Number(d.amount));
  }

  const coachAthlete =
    athleteList.find((a) => a.user_id === user.id) ?? null;

  return (
    <CoachDashboardClient
      fundraiser={active}
      coachAthlete={coachAthlete}
      coachEmail={user.email ?? null}
      coachUsername={
        typeof user.user_metadata?.username === "string"
          ? user.user_metadata.username
          : typeof user.user_metadata?.preferred_username === "string"
            ? user.user_metadata.preferred_username
            : null
      }
      athletes={athleteList}
      donations={donationList}
      textsByAthlete={Object.fromEntries(textsByAthlete)}
      donationsByAthlete={Object.fromEntries(donationsByAthlete)}
      raisedByAthlete={Object.fromEntries(raisedByAthlete)}
    />
  );
}
