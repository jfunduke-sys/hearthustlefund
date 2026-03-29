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
} from "@heart-and-hustle/shared";
import {
  approveAndGenerateCode,
  generateStandaloneCode,
  rejectRequest,
} from "@/app/actions/admin";
import { computeFundraiserAnalytics } from "@/lib/admin-fundraiser-analytics";
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
  const [codeModal, setCodeModal] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<SchoolRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [standaloneOpen, setStandaloneOpen] = useState(false);
  const [standaloneEmail, setStandaloneEmail] = useState("");

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
        <TabsList className="flex h-auto min-h-10 flex-wrap gap-1">
          <TabsTrigger value="open-requests">Open requests</TabsTrigger>
          <TabsTrigger value="approved">Approved fundraisers</TabsTrigger>
          <TabsTrigger value="active">Active fundraisers</TabsTrigger>
          <TabsTrigger value="closed">Closed fundraisers</TabsTrigger>
        </TabsList>

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
                school or district (tax ID for payments).
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Lead contact</TableHead>
                    <TableHead>Coach email</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openRequests.length === 0 && !requestsFetchError ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
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
                      <TableCell>{r.admin_name}</TableCell>
                      <TableCell>{r.admin_email}</TableCell>
                      <TableCell>
                        {formatDisplayDateTime(r.created_at)}
                      </TableCell>
                      <TableCell>{requestBadge(r.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
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
                                setCodeModal(res.code);
                                router.refresh();
                              })
                            }
                          >
                            Approve &amp; code
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
                        colSpan={7}
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
                Historical campaigns. Analytics use donations, athlete roster,
                and contact rows (texts logged in-app). Add legal / tax notes on
                the fundraiser detail page.
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
                    <TableHead>Gross raised</TableHead>
                    <TableHead>Donations</TableHead>
                    <TableHead>Texts sent</TableHead>
                    <TableHead>Conversion</TableHead>
                    <TableHead>Avg donation</TableHead>
                    <TableHead>Avg / athlete</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedFundraisers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
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
                        <TableCell>{a.donationCount}</TableCell>
                        <TableCell>{a.textsSent}</TableCell>
                        <TableCell>
                          {a.conversionPercent != null
                            ? `${a.conversionPercent.toFixed(1)}%`
                            : "—"}
                          <span className="block text-[10px] text-slate-500">
                            donations ÷ texts
                          </span>
                        </TableCell>
                        <TableCell>${a.avgDonation.toFixed(2)}</TableCell>
                        <TableCell>${a.avgRaisedPerAthlete.toFixed(2)}</TableCell>
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
                Avg donation, avg raised per athlete, and compliance notes are on
                the detail page.
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
              Email this code to the fundraiser lead. They open{" "}
              <strong>Coach login</strong> on your site →{" "}
              <strong>Start with my code</strong>, enter{" "}
              <strong>this same email</strong> and the code, create a password,
              then finish campaign setup. They use that email + password on return
              visits.
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-md bg-slate-100 p-4 text-center font-mono text-lg">
            {codeModal}
          </p>
          <DialogFooter>
            <Button onClick={() => codeModal && copyCode(codeModal)}>
              Copy to clipboard
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
                  setStandaloneOpen(false);
                  setStandaloneEmail("");
                  setCodeModal(res.code);
                  router.refresh();
                })
              }
            >
              Generate
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
