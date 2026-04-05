import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import DonateForm from "./donate-form";
import type { Athlete, Fundraiser } from "@heart-and-hustle/shared";
import { getCampaignWindowPhase } from "@heart-and-hustle/shared";

export default async function DonatePage({
  params,
}: {
  params: { token: string };
}) {
  const admin = createAdminClient();
  const { data: athlete } = await admin
    .from("athletes")
    .select("*")
    .eq("unique_link_token", params.token)
    .maybeSingle();

  if (!athlete) notFound();

  const { data: fundraiser } = await admin
    .from("fundraisers")
    .select("*")
    .eq("id", athlete.fundraiser_id)
    .single();

  if (!fundraiser || fundraiser.status !== "active") notFound();

  const { data: donations } = await admin
    .from("donations")
    .select("amount")
    .eq("fundraiser_id", fundraiser.id);

  const { data: athleteDonations } = await admin
    .from("donations")
    .select("amount")
    .eq("athlete_id", athlete.id);

  const teamRaised =
    donations?.reduce((s, d) => s + Number(d.amount), 0) ?? 0;
  const athleteRaised =
    athleteDonations?.reduce((s, d) => s + Number(d.amount), 0) ?? 0;

  const fr = fundraiser as Fundraiser;
  const campaignPhase = getCampaignWindowPhase(fr.start_date, fr.end_date);

  return (
    <DonateForm
      athlete={athlete as Athlete}
      fundraiser={fr}
      campaignPhase={campaignPhase}
      teamRaised={teamRaised}
      athleteRaised={athleteRaised}
    />
  );
}
