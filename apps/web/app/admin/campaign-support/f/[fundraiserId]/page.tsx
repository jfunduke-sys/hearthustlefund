import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Athlete, Fundraiser } from "@heart-and-hustle/shared";
import CampaignSupportFundraiserClient from "./campaign-support-fundraiser-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CoachGroupRow = { id: string; name: string; sort_order: number };

export default async function CampaignSupportFundraiserPage({
  params,
}: {
  params: Promise<{ fundraiserId: string }>;
}) {
  noStore();
  const { fundraiserId } = await params;
  const admin = createAdminClient();

  const { data: fundraiser, error: fErr } = await admin
    .from("fundraisers")
    .select("*")
    .eq("id", fundraiserId)
    .maybeSingle();

  if (fErr || !fundraiser) notFound();

  const f = fundraiser as Fundraiser;

  let coachEmail: string | null = null;
  if (f.coach_id) {
    const { data: uwrap, error: uErr } = await admin.auth.admin.getUserById(
      f.coach_id
    );
    if (!uErr) coachEmail = uwrap.user?.email ?? null;
  }

  const { data: athletes } = await admin
    .from("athletes")
    .select("id, full_name, user_id")
    .eq("fundraiser_id", fundraiserId);

  const athleteList = (athletes ?? []) as Pick<
    Athlete,
    "id" | "full_name" | "user_id"
  >[];
  const athleteIds = athleteList.map((a) => a.id);

  let groupsSetup: {
    groups: CoachGroupRow[];
    memberGroupByAthleteId: Record<string, string | null>;
    managerUserIdByGroupId: Record<string, string | null>;
  } | null = null;

  if (f.uses_campaign_groups) {
    const { data: grpRows } = await admin
      .from("fundraiser_groups")
      .select("id, name, sort_order")
      .eq("fundraiser_id", fundraiserId)
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
      .eq("fundraiser_id", fundraiserId);
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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <CampaignSupportFundraiserClient
        fundraiser={f}
        coachEmail={coachEmail}
        athletes={athleteList}
        groupsSetup={groupsSetup}
      />
    </div>
  );
}
