import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteHeader } from "@/components/marketing-site-header";
import { BRAND } from "@/lib/brand";
import { PLATFORM } from "@heart-and-hustle/shared";
import {
  SMS_REMINDER_A2P_MESSAGE_FLOW_TEMPLATE,
  SMS_REMINDER_CONSENT_CHECKBOX_COPY,
  SMS_REMINDER_CONSENT_VERSION,
} from "@heart-and-hustle/shared";

export const metadata: Metadata = {
  title: `SMS reminders — ${BRAND.name}`,
  description:
    "How Heart & Hustle Fundraising obtains consent for optional campaign reminder texts, opt-out, and policies.",
};

export default function SmsRemindersInfoPage() {
  const resolvedBase =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "YOUR_PRODUCTION_WEBSITE";
  const a2pMessageFlow =
    SMS_REMINDER_A2P_MESSAGE_FLOW_TEMPLATE.replace(
      /BASE_URL/g,
      resolvedBase.endsWith("/")
        ? resolvedBase.slice(0, -1)
        : resolvedBase
    );

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
          reminders during an <strong>active</strong> fundraiser to help
          participants follow up with supporters. We do not buy phone lists or
          send unrelated marketing.
        </p>

        <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50/90 p-5 text-slate-900 shadow-sm">
          <h2 className="text-lg font-semibold text-hh-dark">
            Carrier registration (A2P) — complete message flow
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-800">
            Registration systems (e.g. Twilio 10DLC) ask for every opt-in path and
            disclosures in one narrative. Paste the block below into the{" "}
            <strong>Message flow</strong> / <strong>Call to action</strong>{" "}
            field. Replace <strong>YOUR_PRODUCTION_WEBSITE</strong> with your live
            site root if your deploy does not set{" "}
            <code className="rounded bg-white px-1 text-xs">
              NEXT_PUBLIC_APP_URL
            </code>
            .
          </p>
          <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-amber-200/80 bg-white p-4 text-xs leading-relaxed text-slate-900 sm:text-sm">
            {a2pMessageFlow}
          </pre>
        </section>

        <section className="mt-10 space-y-4 text-slate-800">
          <h2 className="text-lg font-semibold text-hh-dark">How you opt in</h2>
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed sm:text-base">
            <li>
              <strong>Mobile app (primary):</strong> When you create your
              account or update your profile, you may enter a U.S. mobile number
              and check a box that shows the same consent language you see on
              this page. Saving your number requires that consent when SMS is
              enabled.
            </li>
            <li>
              <strong>Website (limited testing / same account):</strong> The
              same account can be used on the web; optional SMS consent and
              number follow the same rules where offered on the join form.
            </li>
            <li>
              <strong>Coaches / leads:</strong> If the platform sends campaign
              reminders to a coach number, consent is collected when that number
              is provided in onboarding or account settings with the same
              disclosures where applicable.
            </li>
          </ul>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Exact consent wording (version {SMS_REMINDER_CONSENT_VERSION})
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-800">
            {SMS_REMINDER_CONSENT_CHECKBOX_COPY}
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-slate-800 sm:text-base">
          <h2 className="text-lg font-semibold text-hh-dark">Policies &amp; rates</h2>
          <p>
            Before or when you opt in, review our{" "}
            <Link
              href="/terms"
              className="font-semibold text-hh-primary underline underline-offset-2"
            >
              Terms of service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-semibold text-hh-primary underline underline-offset-2"
            >
              Privacy policy
            </Link>
            . For approved school programs, messaging responsibilities are also
            described in our Terms of service (Fundraising Services Agreement).
            Message frequency is typically
            about <strong>every three days</strong>{" "}
            during an active campaign, plus the <strong>last campaign day</strong>.
            <strong> Message and data rates may apply</strong> according to your
            carrier.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-slate-800 sm:text-base">
          <h2 className="text-lg font-semibold text-hh-dark">How you opt out</h2>
          <p>
            Reply <strong>STOP</strong> to any message from us to cancel
            further texts. Reply <strong>HELP</strong> for help. You can also
            turn off reminders in the {PLATFORM.shortName} app (remove consent /
            clear your saved reminder number in your account contact settings).
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
