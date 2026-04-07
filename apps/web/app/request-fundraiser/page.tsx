"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

function trimOrEmpty(v: FormDataEntryValue | null | undefined) {
  return String(v ?? "").trim();
}

function parseISODate(s: string): Date | null {
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

/** Rejects empty or whitespace-only strings. */
function validateRequestForm(fd: FormData): string | null {
  const schoolName = trimOrEmpty(fd.get("school_name"));
  if (!schoolName) return "School/organization name is required.";

  const street = trimOrEmpty(fd.get("school_street"));
  const city = trimOrEmpty(fd.get("school_city"));
  const state = trimOrEmpty(fd.get("school_state"));
  const zip = trimOrEmpty(fd.get("school_zip"));
  if (!street) return "Street address is required.";
  if (!city) return "City is required.";
  if (!state) return "State is required.";
  if (state.length < 2) return "Please enter a valid state.";
  if (!zip) return "ZIP code is required.";
  const zipDigits = zip.replace(/\D/g, "");
  if (zipDigits.length < 5) return "ZIP code must include at least 5 digits.";

  const sport = trimOrEmpty(fd.get("sport_club_activity"));
  if (!sport) return "Sport, club, or activity is required.";

  const adminFirst = trimOrEmpty(fd.get("admin_first_name"));
  const adminLast = trimOrEmpty(fd.get("admin_last_name"));
  if (!adminFirst) return "Coach / lead first name is required.";
  if (!adminLast) return "Coach / lead last name is required.";

  const email = trimOrEmpty(fd.get("admin_email"));
  if (!email) return "Email is required.";

  const phone = trimOrEmpty(fd.get("admin_phone"));
  if (!phone) return "Phone number is required.";
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return "Phone number must include at least 10 digits.";
  }

  const estRaw = trimOrEmpty(fd.get("estimated_athletes"));
  if (!estRaw) return "Estimated number of participants is required.";
  const estNum = parseInt(estRaw, 10);
  if (Number.isNaN(estNum) || estNum < 1) {
    return "Enter a valid estimated number of participants (at least 1).";
  }

  const startRaw = trimOrEmpty(fd.get("fundraiser_start_date"));
  const endRaw = trimOrEmpty(fd.get("fundraiser_end_date"));
  if (!startRaw) return "Proposed fundraiser start date is required.";
  if (!endRaw) return "Proposed fundraiser end date is required.";
  const startD = parseISODate(startRaw);
  const endD = parseISODate(endRaw);
  if (!startD || !endD) return "Enter valid fundraiser dates.";
  if (endD < startD) {
    return "End date must be on or after the start date.";
  }

  const kick = trimOrEmpty(fd.get("kickoff_setup_preference"));
  if (kick !== "hh_rep_in_person" && kick !== "self_run") {
    return "Please choose how you’d like to run your fundraiser kickoff.";
  }

  return null;
}

export default function RequestFundraiserPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ack, setAck] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!ack) {
      setError(
        "Please confirm the verification and paperwork acknowledgment below."
      );
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);

    const validationError = validateRequestForm(fd);
    if (validationError) {
      setError(validationError);
      return;
    }

    const schoolStreet = trimOrEmpty(fd.get("school_street"));
    const schoolCity = trimOrEmpty(fd.get("school_city"));
    const schoolState = trimOrEmpty(fd.get("school_state"));
    const schoolZip = trimOrEmpty(fd.get("school_zip"));
    const schoolAddress = `${schoolStreet}, ${schoolCity}, ${schoolState} ${schoolZip}`;
    const estNum = parseInt(trimOrEmpty(fd.get("estimated_athletes")), 10);
    const adminFirst = trimOrEmpty(fd.get("admin_first_name"));
    const adminLast = trimOrEmpty(fd.get("admin_last_name"));
    const adminFull = [adminFirst, adminLast].filter(Boolean).join(" ");
    const notesRaw = trimOrEmpty(fd.get("notes"));

    setLoading(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("school_requests").insert({
      school_name: trimOrEmpty(fd.get("school_name")),
      school_district: trimOrEmpty(fd.get("school_district")),
      school_street: schoolStreet,
      school_city: schoolCity,
      school_state: schoolState,
      school_zip: schoolZip,
      school_address: schoolAddress,
      sport_club_activity: trimOrEmpty(fd.get("sport_club_activity")),
      admin_name: adminFull,
      admin_first_name: adminFirst,
      admin_last_name: adminLast,
      admin_email: trimOrEmpty(fd.get("admin_email")),
      admin_phone: trimOrEmpty(fd.get("admin_phone")),
      estimated_athletes: estNum,
      fundraiser_start_date: trimOrEmpty(fd.get("fundraiser_start_date")),
      fundraiser_end_date: trimOrEmpty(fd.get("fundraiser_end_date")),
      kickoff_setup_preference: trimOrEmpty(fd.get("kickoff_setup_preference")),
      notes: notesRaw || null,
      status: "pending",
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDone(true);
    form.reset();
    setAck(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(192,57,43,0.12),transparent),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="text-sm font-medium text-hh-primary hover:underline"
        >
          ← Back Home
        </Link>

        <h1 className="mt-8 text-center text-2xl font-extrabold tracking-tight text-hh-dark sm:mt-10 sm:text-3xl">
          {BRAND.name}
        </h1>

        <Card className="mt-8 border-slate-200/90 shadow-xl shadow-hh-dark/5 sm:rounded-2xl">
          <CardContent className="px-4 py-6 sm:p-8">
            {done ? (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 sm:p-5"
                role="status"
              >
                <p className="leading-relaxed">
                  <span className="font-semibold">
                    Your request has been received!
                  </span>{" "}
                  A member of the Heart &amp; Hustle Team will be in touch within
                  2 business days to walk you through the next steps. We&apos;re
                  excited to bring your program on board.
                </p>
              </div>
            ) : (
              <form className="space-y-5 sm:space-y-6" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="school_name" className="text-base">
                    School/Organization Name
                  </Label>
                  <Input
                    id="school_name"
                    name="school_name"
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school_district" className="text-base">
                    School District{" "}
                    <span className="font-normal text-slate-500">(optional)</span>
                  </Label>
                  <Input
                    id="school_district"
                    name="school_district"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-base font-semibold text-hh-dark">
                    School/Organization Address
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="school_street" className="text-base">
                      Street Address
                    </Label>
                    <Input
                      id="school_street"
                      name="school_street"
                      required
                      autoComplete="street-address"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="school_city" className="text-base">
                        City
                      </Label>
                      <Input
                        id="school_city"
                        name="school_city"
                        required
                        autoComplete="address-level2"
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school_state" className="text-base">
                        State
                      </Label>
                      <Input
                        id="school_state"
                        name="school_state"
                        required
                        readOnly
                        defaultValue="IL"
                        autoComplete="address-level1"
                        title="Campaigns are currently available in Illinois only."
                        className="h-12 bg-slate-50/90 text-base"
                      />
                      <p className="text-xs text-slate-500">
                        Illinois only — this field is set to IL for you.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school_zip" className="text-base">
                        ZIP Code
                      </Label>
                      <Input
                        id="school_zip"
                        name="school_zip"
                        required
                        inputMode="numeric"
                        autoComplete="postal-code"
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sport_club_activity" className="text-base">
                    Sport, Club, or Activity
                  </Label>
                  <Input
                    id="sport_club_activity"
                    name="sport_club_activity"
                    required
                    placeholder="e.g. varsity football, marching band, drama"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-base font-semibold text-hh-dark">
                    Proposed Fundraiser Dates
                  </p>
                  <p className="text-sm text-slate-600">
                    Approximate window you have in mind. The team will confirm
                    final dates before approval.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fundraiser_start_date" className="text-base">
                        Start Date
                      </Label>
                      <Input
                        id="fundraiser_start_date"
                        name="fundraiser_start_date"
                        type="date"
                        required
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fundraiser_end_date" className="text-base">
                        End Date
                      </Label>
                      <Input
                        id="fundraiser_end_date"
                        name="fundraiser_end_date"
                        type="date"
                        required
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                </div>
                <fieldset className="space-y-3">
                  <legend className="text-base font-semibold text-hh-dark">
                    Fundraiser Kickoff
                  </legend>
                  <p className="text-sm text-slate-600">
                    Choose one. This helps us schedule support if you want a
                    Heart &amp; Hustle team member on-site.
                  </p>
                  <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <label className="flex cursor-pointer gap-3">
                      <input
                        type="radio"
                        name="kickoff_setup_preference"
                        value="hh_rep_in_person"
                        required
                        className="mt-1 h-4 w-4 shrink-0 accent-hh-primary"
                      />
                      <span className="text-sm leading-snug text-slate-800">
                        <span className="font-semibold text-hh-dark">
                          In-Person Kickoff With a Heart &amp; Hustle Rep
                        </span>
                        <span className="mt-0.5 block text-slate-600">
                          Schedule someone from our team to help set up and
                          launch with your athletes on-site.
                        </span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer gap-3">
                      <input
                        type="radio"
                        name="kickoff_setup_preference"
                        value="self_run"
                        className="mt-1 h-4 w-4 shrink-0 accent-hh-primary"
                      />
                      <span className="text-sm leading-snug text-slate-800">
                        <span className="font-semibold text-hh-dark">
                          We&apos;ll Handle Our Own Kickoff
                        </span>
                        <span className="mt-0.5 block text-slate-600">
                          Your staff runs the launch; no Heart &amp; Hustle team
                          member needed on-site.
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin_first_name" className="text-base">
                      Coach / Lead First Name
                    </Label>
                    <Input
                      id="admin_first_name"
                      name="admin_first_name"
                      required
                      autoComplete="given-name"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_last_name" className="text-base">
                      Coach / Lead Last Name
                    </Label>
                    <Input
                      id="admin_last_name"
                      name="admin_last_name"
                      required
                      autoComplete="family-name"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_email" className="text-base">
                    Email Address
                  </Label>
                  <p className="text-sm leading-relaxed text-slate-600">
                    The email you use here will be the email you use to sign in
                    to your coach dashboard.
                  </p>
                  <Input
                    id="admin_email"
                    name="admin_email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_phone" className="text-base">
                    Your Phone
                  </Label>
                  <Input
                    id="admin_phone"
                    name="admin_phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_athletes" className="text-base">
                    Estimated Number of Participants
                  </Label>
                  <Input
                    id="estimated_athletes"
                    name="estimated_athletes"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base">
                    Additional Notes{" "}
                    <span className="font-normal text-slate-500">(optional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="min-h-[5.5rem] resize-y text-base"
                    placeholder="Anything else we should know about your program or timeline"
                  />
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/90 p-4">
                  <Checkbox
                    id="ack"
                    checked={ack}
                    onCheckedChange={(v: boolean | "indeterminate") =>
                      setAck(v === true)
                    }
                    className="mt-1"
                  />
                  <Label
                    htmlFor="ack"
                    className="text-sm font-normal leading-relaxed sm:text-[15px]"
                  >
                    I understand that Heart &amp; Hustle Fundraising will verify
                    existing agreements and documentation on file for my school
                    or organization, and collect any outstanding paperwork —
                    including a W-9 and signed fundraising agreement — prior to
                    launching my campaign.
                  </Label>
                </div>
                {error ? (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="h-12 w-full text-base font-semibold sm:h-14 sm:text-lg"
                  disabled={loading}
                >
                  {loading ? "Submitting…" : "Submit Request"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
