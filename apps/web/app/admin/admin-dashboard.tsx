"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand-logo";
import type {
  Athlete,
  AthleteContact,
  Donation,
  Fundraiser,
  FundraiserCode,
  SchoolRequest,
} from "@heart-and-hustle/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SuperadminTabs } from "./superadmin-tabs";

type Props = {
  requests: SchoolRequest[];
  requestsFetchError?: string | null;
  fundraisers: Fundraiser[];
  codes: FundraiserCode[];
  donations: Donation[];
  athletes: Athlete[];
  contacts: AthleteContact[];
  summary: {
    openRequests: number;
    activeFundraisers: number;
    totalRaised: number;
    totalDonors: number;
    totalCodes: number;
  };
};

export default function AdminDashboard({
  requests,
  requestsFetchError,
  fundraisers,
  codes,
  donations,
  athletes,
  contacts,
  summary,
}: Props) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-hh-primary">SuperAdmin</p>
            <BrandLogo className="mt-1 h-9 w-auto sm:h-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="secondary" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {requestsFetchError ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 print:hidden"
            role="alert"
          >
            <p className="font-semibold">Could not load school requests</p>
            <p className="mt-1 font-mono text-xs">{requestsFetchError}</p>
            <p className="mt-2 text-red-800">
              Check that{" "}
              <code className="rounded bg-red-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
              is set for this deployment and matches your Supabase project.
            </p>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Open requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-hh-dark">
                {summary.openRequests}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Pending + in progress (not approved/rejected)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Active fundraisers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-hh-dark">
                {summary.activeFundraisers}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total raised (all time)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-hh-dark">
                ${summary.totalRaised.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Codes / donors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-hh-dark">
                {summary.totalCodes}{" "}
                <span className="text-lg font-normal text-slate-500">
                  / {summary.totalDonors} donors
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        <SuperadminTabs
          requests={requests}
          requestsFetchError={requestsFetchError}
          fundraisers={fundraisers}
          codes={codes}
          donations={donations}
          athletes={athletes}
          contacts={contacts}
        />
      </main>
    </div>
  );
}
