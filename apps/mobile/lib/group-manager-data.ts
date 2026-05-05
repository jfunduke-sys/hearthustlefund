import { supabase } from "./supabase";

export type GroupScoreboardRow = {
  group_id: string;
  group_name: string;
  sort_order: number;
  total_raised: string | number;
};

export type GroupSummaryRow = {
  group_id: string;
  group_name: string;
  participant_count: number;
  donation_count: number;
  raised_total: string | number;
  texts_sent: number;
  avg_texts_per_participant: string | number | null;
};

export type GroupRosterRow = {
  athlete_id: string;
  full_name: string;
  donation_count: number;
  raised_total: string | number;
  texts_sent: number;
};

export async function fetchGroupManagerScoreboard(
  fundraiserId: string
): Promise<{ rows: GroupScoreboardRow[] | null; error: string | null }> {
  const { data, error } = await supabase.rpc("fundraiser_groups_scoreboard", {
    p_fundraiser_id: fundraiserId,
  });
  if (error) return { rows: null, error: error.message };
  return { rows: (data as GroupScoreboardRow[]) ?? [], error: null };
}

export async function fetchGroupManagerSummary(
  fundraiserId: string
): Promise<{ row: GroupSummaryRow | null; error: string | null }> {
  const { data, error } = await supabase.rpc(
    "fundraiser_group_manager_my_group_summary",
    { p_fundraiser_id: fundraiserId }
  );
  if (error) return { row: null, error: error.message };
  const arr = data as GroupSummaryRow[] | null;
  const row = arr?.[0] ?? null;
  return { row, error: null };
}

export async function fetchGroupManagerRoster(
  fundraiserId: string
): Promise<{ rows: GroupRosterRow[] | null; error: string | null }> {
  const { data, error } = await supabase.rpc(
    "fundraiser_group_manager_my_roster",
    { p_fundraiser_id: fundraiserId }
  );
  if (error) return { rows: null, error: error.message };
  return { rows: (data as GroupRosterRow[]) ?? [], error: null };
}

export async function fetchFundraiserUsesGroups(
  fundraiserId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("fundraisers")
    .select("uses_campaign_groups")
    .eq("id", fundraiserId)
    .maybeSingle();
  if (error || !data) return false;
  return data.uses_campaign_groups === true;
}
