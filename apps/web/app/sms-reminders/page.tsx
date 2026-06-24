import type { Metadata } from "next";
import Link from "next/link";
import { SmsOptInScreenshots } from "@/components/sms-opt-in-screenshots";
import { MarketingSiteHeader } from "@/components/marketing-site-header";
import { BRAND } from "@/lib/brand";
import {
  ANDROID_PLAY_STORE_URL,
  IOS_APP_STORE_URL,
} from "@/lib/mobile-store-urls";
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

function OptInScreenMockup() {
  return (
    <div
      id="opt-in-screen"
      className="mx-auto max-w-sm scroll-mt-24 rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-md"
      aria-label="Hosted reproduction of the in-app SMS opt-in screen for carrier review"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Hosted opt-in screen (mobile app · Dashboard → Your Contact Info)
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
        The live opt-in requires app login. This public page reproduces the exact
        consent UI for A2P review. Checkbox is <strong>unchecked by default</strong>.
      </p>
      <p className="mt-3 text-sm font-bold text-hh-dark">Your Contact Info</p>
      <label htmlFor="sms-opt-in-phone-demo" className="mt-3 block text-xs font-semibold text-slate-600">
        US mobile (optional)
      </label>
      <input
        id="sms-opt-in-phone-demo"
        type="tel"
        readOnly
        placeholder="10-digit mobile"
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-400"
        aria-label="Phone number field (demonstration only — opt-in occurs in the mobile app)"
      />
      <div className="mt-3 flex items-start gap-3">
        <input
          type="checkbox"
          readOnly
          checked={false}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-400"
          aria-label="SMS consent checkbox (unchecked by default)"
        />
        <p className="text-xs leading-relaxed text-slate-700">
          {SMS_REMINDER_CONSENT_CHECKBOX_COPY} See{" "}
          <Link
            href="/terms"
            className="font-semibold text-hh-primary underline underline-offset-2"
          >
            Terms and Conditions
          </Link>
          ,{" "}
          <Link
            href="/privacy"
            className="font-semibold text-hh-primary underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          , and our{" "}
          <Link
            href="/sms-reminders"
            className="font-semibold text-hh-primary underline underline-offset-2"
          >
            SMS program page
          </Link>
          .
        </p>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        <strong>Message frequency:</strong> about every three (3) days during an
        active fundraiser, plus one message on the final campaign day.{" "}
        <strong>Message and data rates may apply.</strong>
      </p>
      <button
        type="button"
        disabled
        className="mt-4 w-full rounded-lg bg-hh-primary px-4 py-2.5 text-center text-sm font-bold text-white opacity-90"
      >
        Save
      </button>
      <p className="mt-3 text-[11px] italic text-slate-500">
        Demonstration only — participants opt in in the {PLATFORM.shortName} iOS/Android
        app after account creation.
      </p>
      {/* Optional PNGs in apps/web/public/sms-opt-in/ */}
      <SmsOptInScreenshots />
    </div>
  );
}

export default function SmsRemindersInfoPage() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://www.hearthustlefund.com";

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
          <strong>{PLATFORM.displayName}</strong> ({appUrl}) sends{" "}
          <strong>optional</strong>, short automated SMS reminders during an{" "}
          <strong>active</strong> school/team fundraiser. Reminders help
          participants follow up with supporters they already contacted. Message
          and data rates may apply. We do not buy phone lists or send unrelated
          marketing.
        </p>

        <section className="mt-10 space-y-4 text-slate-800">
          <h2 className="text-lg font-semibold text-hh-dark">
            How users opt in (Call to Action)
          </h2>
          <p className="text-sm leading-relaxed sm:text-base">
            Opt-in is <strong>optional</strong> and <strong>separate from account
            signup</strong>. Creating an account, joining a team, and fundraising do{" "}
            <strong>not</strong> require a mobile number or SMS consent. Users who
            skip SMS have full app access.
          </p>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed sm:text-base">
            <li>
              User downloads the {PLATFORM.shortName} mobile app:{" "}
              <a
                href={IOS_APP_STORE_URL}
                className="font-semibold text-hh-primary underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                iPhone (App Store)
              </a>
              {" · "}
              <a
                href={ANDROID_PLAY_STORE_URL}
                className="font-semibold text-hh-primary underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                Android (Google Play)
              </a>
              .
            </li>
            <li>
              User joins a team with the 7-character code from their coach and
              creates email + password. The signup screen has{" "}
              <strong>no SMS checkbox</strong> and <strong>no reminder phone
              field</strong>.
            </li>
            <li>
              After login, user opens <strong>Dashboard → Your Contact Info</strong>.
            </li>
            <li>
              User optionally enters a U.S. mobile number, checks the{" "}
              <strong>standalone consent checkbox</strong> (wording below), and taps{" "}
              <strong>Save</strong>. The checkbox is <strong>unchecked by
              default</strong>; reminders cannot be enabled without checking it.
            </li>
            <li>
              Reminders are sent only while the user&apos;s fundraiser is{" "}
              <strong>ACTIVE</strong> (between published start and end dates).
            </li>
          </ol>
          <OptInScreenMockup />
        </section>

        <section className="mt-10 space-y-4 text-slate-800">
          <h2 className="text-lg font-semibold text-hh-dark">Consent language</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Exact checkbox text · version {SMS_REMINDER_CONSENT_VERSION}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-800">
              {SMS_REMINDER_CONSENT_CHECKBOX_COPY}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            No mobile information obtained for SMS opt-in is shared with third
            parties or affiliates for marketing or promotional purposes.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-slate-800 sm:text-base">
          <h2 className="text-lg font-semibold text-hh-dark">
            Sample automated messages
          </h2>
          <p>
            This A2P campaign covers <strong>platform-sent reminder texts only</strong>{" "}
            (not participant-composed texts from the device Messages app):
          </p>
          <ul className="list-disc space-y-2 pl-5 text-xs sm:text-sm">
            <li>
              Heart &amp; Hustle: 3 awaiting donation — open app, Send reminders.
              Lincoln Basketball. Reply STOP to cancel.
            </li>
            <li>
              Heart &amp; Hustle: Resend your link (Lincoln Basketball) — open the
              app to text supporters. Reply STOP to cancel.
            </li>
          </ul>
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
          <h2 className="text-lg font-semibold text-hh-dark">Opt out and help</h2>
          <p>
            Reply <strong>STOP</strong> to cancel further texts from us. Reply{" "}
            <strong>HELP</strong> for help. User may also turn off reminders in the
            app under <strong>Your Contact Info</strong> (remove consent or clear the
            saved number).
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-slate-800 sm:text-base">
          <h2 className="text-lg font-semibold text-hh-dark">Policies</h2>
          <p>
            <Link
              href="/terms"
              className="font-semibold text-hh-primary underline underline-offset-2"
            >
              Terms of service
            </Link>{" "}
            ·{" "}
            <Link
              href="/privacy"
              className="font-semibold text-hh-primary underline underline-offset-2"
            >
              Privacy policy
            </Link>{" "}
            ·{" "}
            <Link
              href="/support"
              className="font-semibold text-hh-primary underline underline-offset-2"
            >
              Support
            </Link>
          </p>
          <p className="text-slate-600">
            Privacy policy:{" "}
            <a
              href={`${appUrl}/privacy`}
              className="font-semibold text-hh-primary underline underline-offset-2"
            >
              {appUrl}/privacy
            </a>
            . Terms:{" "}
            <a
              href={`${appUrl}/terms`}
              className="font-semibold text-hh-primary underline underline-offset-2"
            >
              {appUrl}/terms
            </a>
            .
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
