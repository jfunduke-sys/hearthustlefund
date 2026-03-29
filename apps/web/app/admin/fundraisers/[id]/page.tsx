import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeFundraiserAnalytics } from "@/lib/admin-fundraiser-analytics";
import type {
  Athlete,
  AthleteContact,
  Donation,
  Fundraiser,
  SchoolRequest,
} from "@heart-and-hustle/shared";
import { FundraiserDetailClient } from "./fundraiser-detail-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminFundraiserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: fundraiser, error: fErr } = await admin
    .from("fundraisers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fErr || !fundraiser) notFound();

  const f = fundraiser as Fundraiser;

  const { data: athletes } = await admin
    .from("athletes")
    .select("*")
    .eq("fundraiser_id", id);
  const athleteList = (athletes ?? []) as Athlete[];
  const athleteIds = athleteList.map((a) => a.id);

  const { data: donations } = await admin
    .from("donations")
    .select("*")
    .eq("fundraiser_id", id);

  let contactList: AthleteContact[] = [];
  if (athleteIds.length > 0) {
    const { data: c } = await admin
      .from("athlete_contacts")
      .select("*")
      .in("athlete_id", athleteIds);
    contactList = (c ?? []) as AthleteContact[];
  }

  const analytics = computeFundraiserAnalytics(
    id,
    athleteList,
    (donations ?? []) as Donation[],
    contactList
  );

  let coachEmail: string | null = null;
  if (f.coach_id) {
    const { data: u, error: uErr } = await admin.auth.admin.getUserById(
      f.coach_id
    );
    if (!uErr) coachEmail = u.user?.email ?? null;
  }

  let schoolRequest: SchoolRequest | null = null;
  if (f.code_used) {
    const { data: codeRow } = await admin
      .from("fundraiser_codes")
      .select("school_request_id")
      .eq("code", f.code_used)
      .maybeSingle();
    if (codeRow?.school_request_id) {
      const { data: sr } = await admin
        .from("school_requests")
        .select("*")
        .eq("id", codeRow.school_request_id)
        .maybeSingle();
      if (sr) schoolRequest = sr as SchoolRequest;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <FundraiserDetailClient
          fundraiser={f}
          coachEmail={coachEmail}
          analytics={analytics}
          schoolRequest={schoolRequest}
          complianceNotes={f.admin_compliance_notes ?? null}
        />
      </main>
    </div>
  );
}
