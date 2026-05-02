import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSiteIndexable } from "@/lib/site-config";
import DonateForm from "./donate-form";
import type { Athlete, Fundraiser } from "@heart-and-hustle/shared";
import {
  getCampaignDayBanner,
  getCampaignWindowPhase,
} from "@heart-and-hustle/shared";

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const admin = createAdminClient();
  const { data: athlete } = await admin
    .from("athletes")
    .select("full_name, fundraiser_id")
    .eq("unique_link_token", params.token)
    .maybeSingle();

  if (!athlete) {
    return { title: "Donate" };
  }

  const { data: fundraiser } = await admin
    .from("fundraisers")
    .select("team_name, school_name, status")
    .eq("id", athlete.fundraiser_id)
    .single();

  if (!fundraiser || fundraiser.status !== "active") {
    return { title: "Donate" };
  }

  const name = (athlete as { full_name: string }).full_name;
  const team = String(fundraiser.team_name);
  const school = String(fundraiser.school_name);
  const title = `Donate to ${name}`;
  const description = `Support ${name} — ${team} at ${school}. Secure donation through Heart & Hustle Fundraising.`;
  const path = `/donate/${encodeURIComponent(params.token)}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: isSiteIndexable()
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: { title, description, type: "website" },
  };
}

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
  const dayBanner = getCampaignDayBanner(fr.start_date, fr.end_date);
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const donatePageUrl = base
    ? `${base}/donate/${encodeURIComponent(params.token)}`
    : "";

  return (
    <DonateForm
      athlete={athlete as Athlete}
      fundraiser={fr}
      campaignPhase={campaignPhase}
      dayBanner={dayBanner}
      donatePageUrl={donatePageUrl}
      teamRaised={teamRaised}
      athleteRaised={athleteRaised}
    />
  );
}
