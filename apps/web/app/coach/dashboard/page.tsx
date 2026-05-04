import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND } from "@/lib/brand";
import CoachDashboardClient from "./coach-dashboard-client";

type CoachGroupRow = { id: string; name: string; sort_order: number };
import type { Athlete, Donation, Fundraiser } from "@heart-and-hustle/shared";
import { ensureFundraiserJoinCode } from "@/lib/join-code";
import { ensureCoachParticipantAthlete } from "@/app/actions/coach";

const DONATIONS_PAGE_SIZE = 100;

type Search = {
  donationsPage?: string;
  donationsSort?: string;
};

export default async function CoachDashboardPage({
  searchParams,
}: {
  searchParams?: Search;
}) {
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
        <h1 className="text-2xl font-semibold text-hh-dark">Organizer dashboard</h1>
        <p className="mt-2 text-slate-600">
          You don&apos;t have a fundraiser yet. Create one with your approved
          code.
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-slate-500">
          If your HH code shows as already used but you see this message, you may
          be signed in with a <strong>different email</strong> than the one the
          code was assigned to. Sign out and use{" "}
          <strong>Returning Organizer</strong> with the same email you used when you
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

  const donationsSort =
    searchParams?.donationsSort === "oldest" ? "oldest" : "newest";
  const sortAsc = donationsSort === "oldest";

  const { count: donationsTotalCountRaw } = await supabase
    .from("donations")
    .select("*", { count: "exact", head: true })
    .eq("fundraiser_id", active.id);

  const donationsTotalCount = donationsTotalCountRaw ?? 0;
  const maxPage = Math.max(
    1,
    Math.ceil(donationsTotalCount / DONATIONS_PAGE_SIZE)
  );

  const requestedDonationsPage = Math.max(
    1,
    parseInt(String(searchParams?.donationsPage ?? "1"), 10) || 1
  );
  if (requestedDonationsPage > maxPage) {
    redirect(
      `/coach/dashboard?donationsPage=${maxPage}&donationsSort=${donationsSort}`
    );
  }
  const donationsPage = requestedDonationsPage;

  const from = (donationsPage - 1) * DONATIONS_PAGE_SIZE;
  const to = from + DONATIONS_PAGE_SIZE - 1;

  const { data: donationsPageRows } = await supabase
    .from("donations")
    .select("*")
    .eq("fundraiser_id", active.id)
    .order("created_at", { ascending: sortAsc })
    .range(from, to);

  const { data: totalRaisedRaw } = await supabase.rpc("fundraiser_total_raised", {
    p_fundraiser_id: active.id,
  });

  const campaignTotalRaised =
    totalRaisedRaw != null ? Number(totalRaisedRaw) : 0;

  const { data: perAthleteRows } = await supabase.rpc(
    "fundraiser_donation_totals_by_athlete",
    { p_fundraiser_id: active.id }
  );

  const athleteList = (athletes ?? []) as Athlete[];
  const donationList = (donationsPageRows ?? []) as Donation[];
  const athleteIds = athleteList.map((a) => a.id);

  const donationsByAthlete: Record<string, number> = {};
  const raisedByAthlete: Record<string, number> = {};
  for (const row of perAthleteRows ?? []) {
    const aid = row.athlete_id as string;
    donationsByAthlete[aid] = Number(row.donation_count);
    raisedByAthlete[aid] = Number(row.raised_total);
  }
  for (const a of athleteList) {
    if (donationsByAthlete[a.id] === undefined) donationsByAthlete[a.id] = 0;
    if (raisedByAthlete[a.id] === undefined) raisedByAthlete[a.id] = 0;
  }

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

  const coachAthlete =
    athleteList.find((a) => a.user_id === user.id) ?? null;

  let groupsSetup: {
    groups: CoachGroupRow[];
    memberGroupByAthleteId: Record<string, string | null>;
    managerUserIdByGroupId: Record<string, string | null>;
  } | null = null;

  if (active.uses_campaign_groups) {
    const { data: grpRows } = await admin
      .from("fundraiser_groups")
      .select("id, name, sort_order")
      .eq("fundraiser_id", active.id)
      .order("sort_order", { ascending: true });

    const groupsList = (grpRows ?? []) as CoachGroupRow[];

    const memberGroupByAthleteId: Record<string, string | null> = {};
    for (const a of athleteList) {
      memberGroupByAthleteId[a.id] = null;
    }
    if (athleteIds.length > 0) {
      const { data: memRows } = await admin
        .from("fundraiser_group_members")
        .select("athlete_id, group_id")
        .in("athlete_id", athleteIds);
      for (const row of memRows ?? []) {
        memberGroupByAthleteId[row.athlete_id as string] = row.group_id as string;
      }
    }

    const managerUserIdByGroupId: Record<string, string | null> = {};
    for (const g of groupsList) {
      managerUserIdByGroupId[g.id] = null;
    }
    const { data: mgrRows } = await admin
      .from("fundraiser_group_managers")
      .select("group_id, user_id")
      .eq("fundraiser_id", active.id);
    for (const row of mgrRows ?? []) {
      managerUserIdByGroupId[row.group_id as string] = row.user_id as string;
    }

    groupsSetup = {
      groups: groupsList,
      memberGroupByAthleteId,
      managerUserIdByGroupId,
    };
  }

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
      campaignTotalRaised={campaignTotalRaised}
      donationsTotalCount={donationsTotalCount}
      donationsPage={donationsPage}
      donationsPageSize={DONATIONS_PAGE_SIZE}
      donationsSort={donationsSort}
      textsByAthlete={Object.fromEntries(textsByAthlete)}
      donationsByAthlete={donationsByAthlete}
      raisedByAthlete={raisedByAthlete}
      groupsSetup={groupsSetup}
    />
  );
}
