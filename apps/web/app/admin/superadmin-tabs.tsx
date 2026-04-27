"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Athlete,
  AthleteContact,
  Donation,
  Fundraiser,
  FundraiserCode,
  SchoolRequest,
} from "@heart-and-hustle/shared";
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatKickoffSetupPreference,
  schoolRequestLeadDisplayName,
} from "@heart-and-hustle/shared";
import {
  approveAndGenerateCode,
  generateStandaloneCode,
  rejectRequest,
} from "@/app/actions/admin";
import {
  computeFundraiserAnalytics,
  computeRevenueSplitFromDonations,
} from "@/lib/admin-fundraiser-analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FundraisingServicesAgreementAdminPanel } from "@/components/fundraising-services-agreement-admin-panel";

function requestBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="pending">Pending</Badge>;
    case "paperwork_sent":
      return <Badge variant="paperwork">W-9 / paperwork</Badge>;
    case "approved":
      return <Badge variant="approved">Approved</Badge>;
    case "rejected":
      return <Badge variant="rejected">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function fundraiserStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="approved">Active</Badge>;
    case "completed":
      return <Badge variant="approved">Completed</Badge>;
    case "cancelled":
      return <Badge variant="rejected">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatAddress(r: SchoolRequest) {
  const parts = [
    r.school_street?.trim(),
    r.school_city?.trim(),
    r.school_state?.trim(),
    r.school_zip?.trim(),
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return r.school_address;
}

type Props = {
  requests: SchoolRequest[];
  requestsFetchError?: string | null;
  fundraisers: Fundraiser[];
  codes: FundraiserCode[];
  donations: Donation[];
  athletes: Athlete[];
  contacts: AthleteContact[];
};

type CodeModalPayload = {
  code: string;
  coachEmail: string;
  schoolName?: string | null;
  activityName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

function buildCoachLaunchEmail(payload: CodeModalPayload) {
  const appName = "Heart & Hustle";
  const appStoreUrl =
    process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim() ||
    "[iPhone App Store link]";
  const playStoreUrl =
    process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL?.trim() ||
    "[Android Google Play link]";
  const webBase =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "[your live website URL]";
  const coachLoginUrl = `${webBase}/coach/login`;
  const dashboardUrl = `${webBase}/coach/dashboard`;
  const schoolLine = payload.schoolName?.trim()
    ? `School: ${payload.schoolName.trim()}\n`
    : "";
  const activityLine = payload.activityName?.trim()
    ? `Program/Activity: ${payload.activityName.trim()}\n`
    : "";
  const dateLine =
    payload.startDate && payload.endDate
      ? `Fundraiser dates: ${formatDisplayDate(payload.startDate)} to ${formatDisplayDate(payload.endDate)}\n`
      : "";

  return `Subject: ${appName} fundraiser approval + your setup code

Hi Coach,

Your fundraiser request has been approved.

${schoolLine}${activityLine}${dateLine}Your one-time ${appName} setup code: ${payload.code}
Code is locked to this coach email: ${payload.coachEmail}

Step-by-step setup
1) Desktop setup (first login with code)
   • Go to: ${coachLoginUrl}
   • Select "Start with my code"
   • Enter this same email (${payload.coachEmail}) + the setup code above
   • Create your password (you'll use email + password on return visits)

2) Complete fundraiser setup on desktop
   • Confirm team/school details, goals, and campaign dates
   • Save and activate so your participant join code is generated
   • Open Coach Dashboard after setup: ${dashboardUrl}

3) Share participant instructions from Coach Dashboard
   • In dashboard, use "Invite message for participants" and tap "Copy full message"
   • Send that message to your participants (text/email/team app)
   • It includes app download links + the participant join code

4) Set yourself up as a participant too
   • In Coach Dashboard, add yourself as a participant if needed
   • In the app, log in with the same coach email + password (do not use the join code for coach login)
   • Turn ON "Show my name on the team participant list" if you want your name visible
   • Copy/share your personal donation link from the app dashboard

5) Participant flow (what your team does)
   • Participants download the app and join with your team code
   • They create accounts, get personal donation links, and use Send Messages for outreach
   • Reminder texts and outreach metrics are tracked in dashboard when messages are sent from the app tools

6) During campaign
   • Use desktop Coach Dashboard for totals, roster, and exports
   • Use app for participant texting/reminders and personal link sharing

7) Fundraiser close + payment
   • At campaign end, review totals and donation records
   • Closeout/payment follows your standard payout process and documentation
   • Keep exported records for accounting/compliance reporting

Quick links
• Coach login (desktop): ${coachLoginUrl}
• Coach dashboard (desktop): ${dashboardUrl}
• iPhone app: ${appStoreUrl}
• Android app: ${playStoreUrl}

Reply to this email if you want us to walk through setup with you live.`;
}

export function SuperadminTabs({
  requests,
  requestsFetchError,
  fundraisers,
  codes,
  donations,
  athletes,
  contacts,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [codeModal, setCodeModal] = useState<CodeModalPayload | null>(null);
  const [rejectOpen, setRejectOpen] = useState<SchoolRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [standaloneOpen, setStandaloneOpen] = useState(false);
  const [standaloneEmail, setStandaloneEmail] = useState("");
  const [viewOpen, setViewOpen] = useState<SchoolRequest | null>(null);

  const openRequests = useMemo(
    () =>
      requests.filter(
        (r) => r.status !== "approved" && r.status !== "rejected"
      ),
    [requests]
  );

  const approvedRequests = useMemo(
    () => requests.filter((r) => r.status === "approved"),
    [requests]
  );

  const approvedRows = useMemo(() => {
    return approvedRequests.map((r) => {
      const code =
        codes.find((c) => c.school_request_id === r.id) ?? null;
      const fundraiser =
        code && code.code
          ? fundraisers.find((f) => f.code_used === code.code) ?? null
          : null;
      return { request: r, code, fundraiser };
    });
  }, [approvedRequests, codes, fundraisers]);

  const activeFundraisers = useMemo(
    () => fundraisers.filter((f) => f.status === "active"),
    [fundraisers]
  );

  const closedFundraisers = useMemo(
    () =>
      fundraisers.filter(
        (f) => f.status === "completed" || f.status === "cancelled"
      ),
    [fundraisers]
  );

  const byFundraiser = useMemo(() => {
    const map = new Map<
      string,
      { raised: number; athletes: Athlete[]; donations: Donation[] }
    >();
    for (const f of fundraisers) {
      map.set(f.id, { raised: 0, athletes: [], donations: [] });
    }
    for (const a of athletes) {
      const m = map.get(a.fundraiser_id);
      if (m) m.athletes.push(a);
    }
    for (const d of donations) {
      const m = map.get(d.fundraiser_id);
      if (m) {
        m.donations.push(d);
        m.raised += Number(d.amount);
      }
    }
    return map;
  }, [fundraisers, athletes, donations]);

  function copyCode(c: string) {
    void navigator.clipboard.writeText(c);
  }

  return (
    <>
      <Tabs defaultValue="open-requests" className="w-full">
        <TabsList className="flex h-auto min-h-10 flex-wrap gap-1 print:hidden">
          <TabsTrigger value="program-agreement">Program agreement</TabsTrigger>
          <TabsTrigger value="open-requests">Open requests</TabsTrigger>
          <TabsTrigger value="approved">Approved fundraisers</TabsTrigger>
          <TabsTrigger value="active">Active fundraisers</TabsTrigger>
          <TabsTrigger value="closed">Closed fundraisers</TabsTrigger>
        </TabsList>

        <TabsContent value="program-agreement" className="mt-6">
          <FundraisingServicesAgreementAdminPanel />
        </TabsContent>

        <TabsContent value="open-requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Open requests</CardTitle>
              <p className="text-sm text-slate-600">
                Pending or paperwork in progress — not yet approved or rejected.
              </p>
              <div
                className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                role="status"
              >
                <strong className="font-semibold">Reminder:</strong> Before you
                approve a request, confirm you have a{" "}
                <strong className="font-semibold">W-9</strong> on file from the
                school or district (tax ID for payments). The{" "}
                <strong>Fundraising Services Agreement</strong> is published as
                Terms of service on the website; use the{" "}
                <strong>Program agreement</strong> tab here to print, copy, or
                export for wet signatures (DocuSign later if you prefer).
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Lead contact</TableHead>
                    <TableHead>Proposed start</TableHead>
                    <TableHead>Proposed end</TableHead>
                    <TableHead>Coach email</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openRequests.length === 0 && !requestsFetchError ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-10 text-center text-slate-500"
                      >
                        No open requests.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {openRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.school_name}
                      </TableCell>
                      <TableCell className="max-w-[10rem] text-slate-700">
                        {r.sport_club_activity?.trim()
                          ? r.sport_club_activity
                          : "—"}
                      </TableCell>
                      <TableCell>{schoolRequestLeadDisplayName(r)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDisplayDate(r.fundraiser_start_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDisplayDate(r.fundraiser_end_date)}
                      </TableCell>
                      <TableCell>{r.admin_email}</TableCell>
                      <TableCell>
                        {formatDisplayDateTime(r.created_at)}
                      </TableCell>
                      <TableCell>{requestBadge(r.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewOpen(r)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            disabled={
                              pending ||
                              r.status === "rejected" ||
                              r.status === "approved"
                            }
                            onClick={() =>
                              startTransition(async () => {
                                const res = await approveAndGenerateCode(r.id);
                                setCodeModal({
                                  code: res.code,
                                  coachEmail: r.admin_email,
                                  schoolName: r.school_name,
                                  activityName: r.sport_club_activity,
                                  startDate: r.fundraiser_start_date,
                                  endDate: r.fundraiser_end_date,
                                });
                                router.refresh();
                              })
                            }
                          >
                            Approve and Generate Code
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={
                              pending ||
                              r.status === "rejected" ||
                              r.status === "approved"
                            }
                            onClick={() => {
                              setRejectOpen(r);
                              setRejectNotes("");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Approved fundraiser requests</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  Intake form data and the HH start code issued for each approval.
                  When the coach redeems the code, a live campaign appears under
                  Active fundraisers.
                </p>
              </div>
              <Button onClick={() => setStandaloneOpen(true)}>
                Generate standalone code
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Proposed start</TableHead>
                    <TableHead>Proposed end</TableHead>
                    <TableHead>HH start code</TableHead>
                    <TableHead>Coach email</TableHead>
                    <TableHead>Est. athletes</TableHead>
                    <TableHead>Campaign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-10 text-center text-slate-500"
                      >
                        No approved requests yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvedRows.map(({ request: r, code, fundraiser }) => (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[10rem] font-medium">
                          {r.school_name}
                          <p className="mt-1 text-xs font-normal text-slate-500">
                            {r.school_district}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[12rem] text-xs text-slate-600">
                          {formatAddress(r)}
                        </TableCell>
                        <TableCell className="max-w-[8rem] text-sm">
                          {r.sport_club_activity ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDisplayDate(r.fundraiser_start_date)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDisplayDate(r.fundraiser_end_date)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {code?.code ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">{r.admin_email}</TableCell>
                        <TableCell>{r.estimated_athletes ?? "—"}</TableCell>
                        <TableCell>
                          {fundraiser ? (
                            <Button variant="link" className="h-auto p-0" asChild>
                              <Link href={`/admin/fundraisers/${fundraiser.id}`}>
                                {fundraiser.team_name}
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-slate-500">Not redeemed yet</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All fundraiser codes</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Assigned to</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{c.code}</TableCell>
                      <TableCell>{c.assigned_to_email ?? "—"}</TableCell>
                      <TableCell>
                        {formatDisplayDateTime(c.created_at)}
                      </TableCell>
                      <TableCell>{c.used ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        {c.expires_at
                          ? formatDisplayDate(c.expires_at)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active fundraisers</CardTitle>
              <p className="text-sm text-slate-600">
                Click a row to open the admin fundraiser view (metrics, coach
                email, compliance notes, and tools). Coaches use{" "}
                <strong>Coach login</strong> with their own account to manage the
                live dashboard.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Raised</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Join code</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeFundraisers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-slate-500"
                      >
                        No active fundraisers.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {activeFundraisers.map((f) => {
                    const pack = byFundraiser.get(f.id);
                    const raised = pack?.raised ?? 0;
                    const goal = Number(f.total_goal);
                    const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
                    return (
                      <TableRow key={f.id}>
                        <TableCell>
                          <Button variant="link" className="h-auto p-0 font-medium" asChild>
                            <Link href={`/admin/fundraisers/${f.id}`}>
                              {f.school_name}
                            </Link>
                          </Button>
                        </TableCell>
                        <TableCell>{f.team_name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDisplayDate(f.start_date)} →{" "}
                          {formatDisplayDate(f.end_date)}
                        </TableCell>
                        <TableCell>${raised.toFixed(2)}</TableCell>
                        <TableCell>
                          {pct.toFixed(0)}% of ${goal.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {f.join_code ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/fundraisers/${f.id}`}>
                              Manage
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Closed fundraisers</CardTitle>
              <p className="text-sm text-slate-600">
                Historical campaigns. Revenue columns use a 90% / 10% split of
                gross donations; Stripe fees sum known stored fees per donation.
                Donation counts, texts, conversion, and averages are on each
                fundraiser&apos;s detail page.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Closed</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead className="text-right whitespace-normal leading-tight">
                      <span className="block">Total gross</span>
                      <span className="block text-[10px] font-normal text-slate-500">
                        of campaign
                      </span>
                    </TableHead>
                    <TableHead className="text-right whitespace-normal leading-tight">
                      <span className="block">Program cut</span>
                      <span className="block text-[10px] font-normal text-slate-500">
                        90% of gross
                      </span>
                    </TableHead>
                    <TableHead className="text-right whitespace-normal leading-tight">
                      <span className="block">H&amp;H cut</span>
                      <span className="block text-[10px] font-normal text-slate-500">
                        10% of gross
                      </span>
                    </TableHead>
                    <TableHead className="text-right whitespace-normal leading-tight">
                      <span className="block">Net revenue</span>
                      <span className="block text-[10px] font-normal text-slate-500">
                        H&amp;H 10% − Stripe fees
                      </span>
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedFundraisers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="py-10 text-center text-slate-500"
                      >
                        No closed fundraisers yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {closedFundraisers.map((f) => {
                    const a = computeFundraiserAnalytics(
                      f.id,
                      athletes,
                      donations,
                      contacts
                    );
                    const pack = byFundraiser.get(f.id);
                    const rev = computeRevenueSplitFromDonations(
                      a.grossRaised,
                      pack?.donations ?? []
                    );
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">
                          {f.school_name}
                        </TableCell>
                        <TableCell>{f.team_name}</TableCell>
                        <TableCell>{fundraiserStatusBadge(f.status)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {f.closed_at
                            ? formatDisplayDateTime(f.closed_at)
                            : "—"}
                        </TableCell>
                        <TableCell>{a.participantCount}</TableCell>
                        <TableCell>${a.grossRaised.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${rev.programCut.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${rev.hhCut.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${rev.netHhRevenue.toFixed(2)}
                          {rev.donationsWithUnknownFee > 0 ? (
                            <span className="mt-0.5 block text-[10px] font-normal text-amber-800">
                              {rev.donationsWithUnknownFee} donation
                              {rev.donationsWithUnknownFee === 1 ? "" : "s"} with
                              unknown Stripe fee
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/fundraisers/${f.id}`}>
                              Detail
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <p className="text-xs text-slate-500">
                Stripe fees in the table are only from donations that have{" "}
                <span className="font-mono">stripe_fee_cents</span> saved; open
                Detail to refresh fees from Stripe when configured.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!codeModal} onOpenChange={() => setCodeModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fundraiser code generated</DialogTitle>
            <DialogDescription>
              Copy the full coach launch email below, paste into your message,
              and send it to the assigned coach.
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-md bg-slate-100 p-4 text-center font-mono text-lg">
            {codeModal?.code}
          </p>
          <p className="text-xs text-slate-600">
            Assigned coach email:{" "}
            <span className="font-medium text-slate-800">
              {codeModal?.coachEmail ?? "—"}
            </span>
          </p>
          <Textarea
            readOnly
            value={codeModal ? buildCoachLaunchEmail(codeModal) : ""}
            rows={16}
            className="text-xs leading-relaxed"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => codeModal && copyCode(codeModal.code)}
            >
              Copy code only
            </Button>
            <Button
              onClick={() =>
                codeModal &&
                void navigator.clipboard.writeText(buildCoachLaunchEmail(codeModal))
              }
            >
              Copy full coach email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={standaloneOpen} onOpenChange={setStandaloneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate coach code</DialogTitle>
            <DialogDescription>
              Every code is locked to one coach email. They use{" "}
              <strong>Coach login → Start with my code</strong> with that email
              plus this code the first time (then a password for later).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="assign">Coach email (required)</Label>
            <Input
              id="assign"
              type="email"
              value={standaloneEmail}
              onChange={(e) => setStandaloneEmail(e.target.value)}
              placeholder="coach@school.edu"
              required
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStandaloneOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={pending || !standaloneEmail.trim()}
              onClick={() =>
                startTransition(async () => {
                  const res = await generateStandaloneCode(standaloneEmail);
                  const assigned = standaloneEmail.trim().toLowerCase();
                  setStandaloneOpen(false);
                  setStandaloneEmail("");
                  setCodeModal({
                    code: res.code,
                    coachEmail: assigned,
                  });
                  router.refresh();
                })
              }
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewOpen}
        onOpenChange={(open: boolean) => {
          if (!open) setViewOpen(null);
        }}
      >
        <DialogContent className="max-h-[min(85vh,720px)] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>School fundraiser request</DialogTitle>
            <DialogDescription>
              Full intake form data{viewOpen ? ` — ${viewOpen.school_name}` : ""}.
            </DialogDescription>
          </DialogHeader>
          {viewOpen ? (
            <dl className="space-y-3 text-sm text-slate-800">
              <div>
                <dt className="font-semibold text-slate-600">School name</dt>
                <dd>{viewOpen.school_name}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">School district</dt>
                <dd>{viewOpen.school_district}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">School address</dt>
                <dd>{formatAddress(viewOpen)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">
                  Sport, club, or activity
                </dt>
                <dd>{viewOpen.sport_club_activity?.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">
                  Proposed fundraiser dates
                </dt>
                <dd>
                  {formatDisplayDate(viewOpen.fundraiser_start_date)} –{" "}
                  {formatDisplayDate(viewOpen.fundraiser_end_date)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">
                  Fundraiser kickoff
                </dt>
                <dd>
                  {formatKickoffSetupPreference(
                    viewOpen.kickoff_setup_preference
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">
                  Coach / lead (first &amp; last)
                </dt>
                <dd>
                  {[
                    viewOpen.admin_first_name?.trim(),
                    viewOpen.admin_last_name?.trim(),
                  ]
                    .filter(Boolean)
                    .join(" ") || schoolRequestLeadDisplayName(viewOpen)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">Coach email</dt>
                <dd>{viewOpen.admin_email}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">Coach phone</dt>
                <dd>{viewOpen.admin_phone}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">
                  Estimated student-athletes
                </dt>
                <dd>{viewOpen.estimated_athletes ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">Additional notes</dt>
                <dd className="whitespace-pre-wrap">
                  {viewOpen.notes?.trim() ? viewOpen.notes : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">Status</dt>
                <dd>{requestBadge(viewOpen.status)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">Submitted</dt>
                <dd>{formatDisplayDateTime(viewOpen.created_at)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">
                  Intake acknowledgments (legacy)
                </dt>
                <dd className="space-y-1 text-slate-800">
                  {viewOpen.fsa_intake_acknowledged_at &&
                  viewOpen.fsa_intake_version ? (
                    <p>
                      FSA intake checkbox: doc v{" "}
                      <span className="font-mono text-xs">
                        {viewOpen.fsa_intake_version}
                      </span>{" "}
                      at{" "}
                      {formatDisplayDateTime(
                        viewOpen.fsa_intake_acknowledged_at
                      )}
                      .
                    </p>
                  ) : null}
                  {viewOpen.fundraiser_terms_acknowledged_at &&
                  viewOpen.fundraiser_terms_version ? (
                    <p>
                      Summary terms checkbox: v{" "}
                      <span className="font-mono text-xs">
                        {viewOpen.fundraiser_terms_version}
                      </span>{" "}
                      at{" "}
                      {formatDisplayDateTime(
                        viewOpen.fundraiser_terms_acknowledged_at
                      )}
                      .
                    </p>
                  ) : null}
                  {!viewOpen.fsa_intake_acknowledged_at &&
                  !viewOpen.fundraiser_terms_acknowledged_at
                    ? "— (none; current intake uses a single paperwork acknowledgment only)"
                    : null}
                </dd>
              </div>
              <div className="flex gap-4 border-t border-slate-200 pt-3 text-xs text-slate-600">
                <span>
                  Paperwork sent: {viewOpen.paperwork_sent ? "Yes" : "No"}
                </span>
                <span>
                  Paperwork returned:{" "}
                  {viewOpen.paperwork_returned ? "Yes" : "No"}
                </span>
              </div>
            </dl>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectOpen} onOpenChange={() => setRejectOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
            <DialogDescription>
              Optional notes are stored on the school request record.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Reason (optional)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(null)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={pending || !rejectOpen}
              onClick={() =>
                startTransition(async () => {
                  if (!rejectOpen) return;
                  await rejectRequest(rejectOpen.id, rejectNotes);
                  setRejectOpen(null);
                  router.refresh();
                })
              }
            >
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
