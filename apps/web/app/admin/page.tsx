import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminDashboard from "./admin-dashboard";
import type {
  Athlete,
  AthleteContact,
  Donation,
  Fundraiser,
  FundraiserCode,
  SchoolRequest,
} from "@heart-and-hustle/shared";

/** Always read live data; avoid cached empty lists after new school requests. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  noStore();
  const admin = createAdminClient();

  const [
    requestsRes,
    { data: fundraisers },
    { data: codes },
    { data: donations },
    { data: athletes },
    { data: contacts },
    pendingRes,
    activeRes,
    donorsRes,
  ] = await Promise.all([
    admin.from("school_requests").select("*").order("created_at", { ascending: false }),
    admin.from("fundraisers").select("*").order("created_at", { ascending: false }),
    admin.from("fundraiser_codes").select("*").order("created_at", { ascending: false }),
    admin.from("donations").select("*").order("created_at", { ascending: false }),
    admin.from("athletes").select("*"),
    admin.from("athlete_contacts").select("*"),
    admin
      .from("school_requests")
      .select("*", { count: "exact", head: true })
      .or("status.eq.pending,status.eq.paperwork_sent"),
    admin
      .from("fundraisers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    admin.from("donations").select("*", { count: "exact", head: true }),
  ]);

  const requests = requestsRes.data;
  const requestsFetchError = requestsRes.error?.message ?? null;

  const totalRaised =
    donations?.reduce((s, d) => s + Number((d as Donation).amount), 0) ?? 0;

  return (
    <AdminDashboard
      requests={(requests ?? []) as SchoolRequest[]}
      requestsFetchError={requestsFetchError}
      fundraisers={(fundraisers ?? []) as Fundraiser[]}
      codes={(codes ?? []) as FundraiserCode[]}
      donations={(donations ?? []) as Donation[]}
      athletes={(athletes ?? []) as Athlete[]}
      contacts={(contacts ?? []) as AthleteContact[]}
      summary={{
        openRequests: pendingRes.count ?? 0,
        activeFundraisers: activeRes.count ?? 0,
        totalRaised,
        totalDonors: donorsRes.count ?? 0,
        totalCodes: codes?.length ?? 0,
      }}
    />
  );
}
