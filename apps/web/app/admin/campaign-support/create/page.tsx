import CampaignSupportCreateClient from "./campaign-support-create-client";

export const dynamic = "force-dynamic";

export default async function CampaignSupportCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const initial = typeof code === "string" && code.trim() ? code.trim() : null;
  return <CampaignSupportCreateClient initialCode={initial} />;
}
