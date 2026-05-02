import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteHeader } from "@/components/marketing-site-header";
import { BRAND } from "@/lib/brand";
import { PLATFORM } from "@heart-and-hustle/shared";
import {
  SMS_REMINDER_CONSENT_CHECKBOX_COPY,
  SMS_REMINDER_CONSENT_VERSION,
} from "@heart-and-hustle/shared";

export const metadata: Metadata = {
  title: "SMS reminders",
  description:
    "How Heart & Hustle Fundraising obtains consent for optional campaign reminder texts, opt-out, and policies.",
  alternates: { canonical: "/sms-reminders" },
};

export default function SmsRemindersInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingSiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-hh-primary">
          SMS program
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-hh-dark sm:text-4xl">
          Fundraising reminder texts
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          {PLATFORM.displayName} may send <strong>optional</strong>, short SMS
          reminders during an <strong>active</strong> fundraiser so participants
          can follow up with supporters. Message and data rates may apply. We do
          not buy phone lists or send unrelated marketing.
        </p>

        <section className="mt-10 space-y-4 text-slate-800">
          <h2 className="text-lg font-semibold text-hh-dark">Consent</h2>
          <p className="text-sm leading-relaxed sm:text-base">
            You agree to reminder texts separately from account creation. Saving a
            U.S. mobile number for reminders requires the consent language below when
            SMS is enabled (mobile profile, limited web joins, or Organizer onboarding
            where applicable). Organizers who receive reminders must provide numbers
            and consent through the same flows where the platform offers SMS.
          </p>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Consent wording · version {SMS_REMINDER_CONSENT_VERSION}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-800">
              {SMS_REMINDER_CONSENT_CHECKBOX_COPY}
            </p>
          </div>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-slate-800 sm:text-base">
          <h2 className="text-lg font-semibold text-hh-dark">Policies</h2>
          <p>
            Review our{" "}
            <Link
              href="/terms"
              className="font-semibold text-hh-primary underline underline-offset-2"
            >
              Terms of service
            </Link>{" "}
            (including Sections 6, 9, and 19 — messaging compliance, data &amp;
            privacy, and electronic communications) and{" "}
            <Link
              href="/privacy"
              className="font-semibold text-hh-primary underline underline-offset-2"
            >
              Privacy policy
            </Link>{" "}
            before or when you opt in.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-slate-800 sm:text-base">
          <h2 className="text-lg font-semibold text-hh-dark">Frequency</h2>
          <p>
            During an active campaign, reminders are typically sent about{" "}
            <strong>every three days</strong>, plus a notice on the{" "}
            <strong>final campaign day</strong>.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-slate-800 sm:text-base">
          <h2 className="text-lg font-semibold text-hh-dark">Opt out</h2>
          <p>
            Reply <strong>STOP</strong> to cancel further texts from us. Reply{" "}
            <strong>HELP</strong> for help. You may also disable reminders in the{" "}
            {PLATFORM.shortName} app by removing SMS consent or clearing your saved
            reminder number in contact settings.
          </p>
        </section>

        <p className="mt-12 text-center text-xs text-slate-500">
          <Link href="/" className="hover:underline">
            {BRAND.name}
          </Link>
        </p>
      </main>
    </div>
  );
}
