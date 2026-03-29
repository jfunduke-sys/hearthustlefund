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

/** Rejects empty or whitespace-only strings. */
function validateRequestForm(fd: FormData): string | null {
  const schoolName = trimOrEmpty(fd.get("school_name"));
  if (!schoolName) return "School name is required.";

  const district = trimOrEmpty(fd.get("school_district"));
  if (!district) return "School district is required.";

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

  const adminName = trimOrEmpty(fd.get("admin_name"));
  if (!adminName) return "Your full name is required.";

  const email = trimOrEmpty(fd.get("admin_email"));
  if (!email) return "Email is required.";

  const phone = trimOrEmpty(fd.get("admin_phone"));
  if (!phone) return "Phone number is required.";
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return "Phone number must include at least 10 digits.";
  }

  const estRaw = trimOrEmpty(fd.get("estimated_athletes"));
  if (!estRaw) return "Estimated student-athletes is required.";
  const estNum = parseInt(estRaw, 10);
  if (Number.isNaN(estNum) || estNum < 1) {
    return "Enter a valid estimated number of athletes (at least 1).";
  }

  const notes = trimOrEmpty(fd.get("notes"));
  if (!notes) return "Additional notes are required.";

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
      setError("Please confirm the Illinois paperwork acknowledgment.");
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
      admin_name: trimOrEmpty(fd.get("admin_name")),
      admin_email: trimOrEmpty(fd.get("admin_email")),
      admin_phone: trimOrEmpty(fd.get("admin_phone")),
      estimated_athletes: estNum,
      notes: trimOrEmpty(fd.get("notes")),
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
          ← Back home
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
                    School name
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
                    School district
                  </Label>
                  <Input
                    id="school_district"
                    name="school_district"
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-base font-semibold text-hh-dark">
                    School address
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="school_street" className="text-base">
                      Street address
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
                        autoComplete="address-level1"
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school_zip" className="text-base">
                        ZIP code
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
                    Sport, club, or activity
                  </Label>
                  <Input
                    id="sport_club_activity"
                    name="sport_club_activity"
                    required
                    placeholder="e.g. varsity football, marching band, drama"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_name" className="text-base">
                    Your full name (lead coach or fundraising contact)
                  </Label>
                  <Input
                    id="admin_name"
                    name="admin_name"
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_email" className="text-base">
                    Email
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
                    Your phone
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
                    Estimated student-athletes participating
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
                    Additional notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    required
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
                    I understand Illinois fundraising regulations require
                    paperwork (including signatures from school administration
                    where applicable) before the fundraiser can begin. Heart
                    &amp; Hustle will contact me with next steps.
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
                  {loading ? "Submitting…" : "Submit request"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
