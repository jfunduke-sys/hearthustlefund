"use client";

import { useState } from "react";
import { submitFundraiserRequest } from "@/app/actions/request-fundraiser";
import { ORGANIZATION_AGREEMENT_ESIGN_CONSENT } from "@heart-and-hustle/shared";
import { MarketingSiteHeader } from "@/components/marketing-site-header";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
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
  if (!adminFirst) return "Organizer first name is required.";
  if (!adminLast) return "Organizer last name is required.";

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

  const goalRaw = trimOrEmpty(fd.get("estimated_goal")).replace(/[$,\s]/g, "");
  if (!goalRaw) return "Estimated fundraising goal is required.";
  if (!/^\d+(\.\d{1,2})?$/.test(goalRaw)) {
    return "Enter a valid estimated fundraising goal (digits only, e.g. 5000).";
  }
  const goalNum = Number(goalRaw);
  if (Number.isNaN(goalNum) || goalNum <= 0) {
    return "Enter a valid estimated fundraising goal (total dollars).";
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

  const district = trimOrEmpty(fd.get("school_district"));
  if (!district) {
    return "School district or organization is required.";
  }

  const kick = trimOrEmpty(fd.get("kickoff_setup_preference"));
  if (kick !== "hh_rep_in_person" && kick !== "self_run") {
    return "Please choose how you’d like to run your fundraiser kickoff.";
  }

  const groupsChoice = trimOrEmpty(fd.get("wants_campaign_groups"));
  if (groupsChoice !== "yes" && groupsChoice !== "no") {
    return "Please choose whether you want to divide the campaign into teams or groups.";
  }

  const signerName = trimOrEmpty(fd.get("signer_name"));
  if (!signerName) {
    return "Type your full legal name to sign the Fundraising Services Agreement.";
  }
  const signerTitle = trimOrEmpty(fd.get("signer_title"));
  if (!signerTitle) {
    return "Enter your title or role (e.g. Athletic Director, Booster President).";
  }

  return null;
}

export default function RequestFundraiserPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const [agreeContract, setAgreeContract] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!ack) {
      setError(
        "Please confirm the verification and paperwork acknowledgment below."
      );
      return;
    }
    if (!agreeContract) {
      setError(
        "Please type your name and check the box to sign the Fundraising Services Agreement."
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

    setLoading(true);
    const result = await submitFundraiserRequest({
      school_name: trimOrEmpty(fd.get("school_name")),
      school_district: trimOrEmpty(fd.get("school_district")),
      school_street: trimOrEmpty(fd.get("school_street")),
      school_city: trimOrEmpty(fd.get("school_city")),
      school_state: trimOrEmpty(fd.get("school_state")),
      school_zip: trimOrEmpty(fd.get("school_zip")),
      sport_club_activity: trimOrEmpty(fd.get("sport_club_activity")),
      admin_first_name: trimOrEmpty(fd.get("admin_first_name")),
      admin_last_name: trimOrEmpty(fd.get("admin_last_name")),
      admin_email: trimOrEmpty(fd.get("admin_email")),
      admin_phone: trimOrEmpty(fd.get("admin_phone")),
      estimated_athletes: parseInt(trimOrEmpty(fd.get("estimated_athletes")), 10),
      estimated_goal: Number(
        trimOrEmpty(fd.get("estimated_goal")).replace(/[$,\s]/g, "")
      ),
      wants_campaign_groups:
        trimOrEmpty(fd.get("wants_campaign_groups")) === "yes",
      fundraiser_start_date: trimOrEmpty(fd.get("fundraiser_start_date")),
      fundraiser_end_date: trimOrEmpty(fd.get("fundraiser_end_date")),
      kickoff_setup_preference: trimOrEmpty(fd.get("kickoff_setup_preference")),
      notes: trimOrEmpty(fd.get("notes")) || null,
      signer_name: trimOrEmpty(fd.get("signer_name")),
      signer_title: trimOrEmpty(fd.get("signer_title")),
    });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
    form.reset();
    setAck(false);
    setAgreeContract(false);
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <MarketingSiteHeader />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(192,57,43,0.12),transparent),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-center text-2xl font-extrabold tracking-tight text-hh-dark sm:text-3xl">
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
                    School District or Organization
                  </Label>
                  <Input
                    id="school_district"
                    name="school_district"
                    required
                    className="h-12 text-base"
                  />
                  <p className="text-xs text-slate-500">
                    If a booster club or private school has no district, enter
                    your organization&apos;s name.
                  </p>
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
                  <legend className="sr-only">Fundraiser kickoff preference</legend>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Kickoff preference
                  </p>
                  <p className="text-base font-semibold text-hh-dark">
                    Fundraiser Kickoff
                  </p>
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
                          launch with your participants on-site.
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
                          We&apos;ll Handle Our Own Launch
                        </span>
                        <span className="mt-0.5 block text-slate-600">
                          Your staff launches and runs the fundraiser. Heart &amp;
                          Hustle provides remote guidance and support as needed.
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin_first_name" className="text-base">
                      Organizer first name
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
                      Organizer last name
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
                    to your Organizer dashboard.
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
                  <Label htmlFor="estimated_goal" className="text-base">
                    Estimated Fundraising Goal (total $)
                  </Label>
                  <Input
                    id="estimated_goal"
                    name="estimated_goal"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    required
                    placeholder="e.g. 5000"
                    className="h-12 text-base"
                  />
                  <p className="text-xs text-slate-500">
                    Your best estimate of the total dollars this program aims to
                    raise (whole dollars is fine). Used only for the required
                    budget in your state fundraising agreement — it is not a
                    commitment.
                  </p>
                </div>
                <fieldset className="space-y-3">
                  <legend className="sr-only">
                    Teams or groups for this campaign
                  </legend>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Campaign structure
                  </p>
                  <p className="text-base font-semibold text-hh-dark">
                    Teams/Groups for This Campaign?
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600">
                    If yes, your Organizer can split participants into named groups,
                    assign a manager per group, and use a per-group scoreboard. Pick
                    no for one combined roster.
                  </p>
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name="wants_campaign_groups"
                        value="yes"
                        required
                        className="h-4 w-4 shrink-0 accent-hh-primary"
                      />
                      <span className="text-sm font-semibold leading-snug text-hh-dark">
                        Yes — Groups with Group Managers
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name="wants_campaign_groups"
                        value="no"
                        className="h-4 w-4 shrink-0 accent-hh-primary"
                      />
                      <span className="text-sm font-semibold leading-snug text-hh-dark">
                        No — One Roster for All
                      </span>
                    </label>
                  </div>
                </fieldset>
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
                <div className="space-y-5 rounded-xl border border-hh-primary/25 bg-gradient-to-b from-hh-primary/[0.06] to-white p-5 sm:p-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Electronic signature
                    </p>
                    <p className="text-base font-semibold text-hh-dark sm:text-lg">
                      Sign the Fundraising Services Agreement
                    </p>
                    <p className="text-sm leading-relaxed text-slate-700">
                      Read the{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-hh-primary underline underline-offset-2"
                      >
                        Fundraising Services Agreement
                      </Link>
                      , then sign below as the Organizer for this campaign. Each
                      team files its own agreement.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="space-y-2">
                      <Label htmlFor="signer_name" className="text-sm font-semibold text-hh-dark">
                        Full legal name
                      </Label>
                      <Input
                        id="signer_name"
                        name="signer_name"
                        required
                        autoComplete="name"
                        placeholder="First and last name"
                        className="h-12 border-0 border-b border-slate-300 bg-transparent px-0 text-lg italic text-hh-dark shadow-none placeholder:text-sm placeholder:not-italic placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                      />
                      <p className="text-xs text-slate-500">
                        This typed name is your electronic signature.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signer_title" className="text-sm font-semibold text-hh-dark">
                        Title / role
                      </Label>
                      <Input
                        id="signer_title"
                        name="signer_title"
                        required
                        placeholder="Coach, Organizer, AD…"
                        className="h-11 text-base placeholder:text-sm placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/80 p-3.5">
                    <Checkbox
                      id="agree_contract"
                      checked={agreeContract}
                      onCheckedChange={(v: boolean | "indeterminate") =>
                        setAgreeContract(v === true)
                      }
                      className="mt-1"
                    />
                    <Label
                      htmlFor="agree_contract"
                      className="text-sm font-normal leading-relaxed text-slate-700"
                    >
                      {ORGANIZATION_AGREEMENT_ESIGN_CONSENT}
                    </Label>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Heart &amp; Hustle will countersign and may also collect a W-9
                    before your campaign launches. A signed PDF is generated for
                    state fundraiser registration records.
                  </p>
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
