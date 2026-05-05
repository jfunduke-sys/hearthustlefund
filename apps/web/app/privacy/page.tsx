import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "Organization and participant data practices for Heart & Hustle's website and mobile app.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-slate-700">
      <Link href="/" className="text-sm text-hh-primary hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-hh-dark">Privacy policy</h1>
      <p className="mt-2 text-sm text-slate-500">
        {BRAND.name} — operated by <strong>Heart and Hustle Fundraising LLC</strong>
        <span className="text-slate-400"> · </span>
        <Link href="/terms" className="text-hh-primary hover:underline">
          Terms of service
        </Link>
      </p>
      <p className="mt-2 text-xs text-slate-500">
        This Privacy policy applies to Company interactions with Organizations,
        Organizers, and participants on the website and mobile app. Donor-specific
        policies are published on donor-facing pages.
      </p>

      <p className="mt-6 rounded-lg border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm leading-relaxed text-slate-800">
        <strong>Organizer</strong> means the coach, sponsor, or lead fundraising
        representative authorized by an Organization to manage campaigns. For this
        policy, participant activity is treated as part of Organization activity and
        responsibilities under our <Link href="/terms" className="text-hh-primary underline">Terms of service</Link>.
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-hh-dark">What we collect</h2>
        <p>
          We collect information Organizations and participants provide for campaign
          setup and operation: participant names, roster details, contact lists that
          users explicitly choose to upload, campaign metadata, and account login data.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">How we use data</h2>
        <p>
          We use personal data only to operate the platform, support campaign workflows,
          process payments through service providers, provide security and fraud controls,
          and satisfy legal, accounting, and compliance requirements.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">What we do not do</h2>
        <p>
          We do <strong>not</strong> sell personal data. We do not use Organization or
          participant data for third-party advertising. We share data only with providers
          needed to run the service (for example hosting, auth, messaging, and payment
          processing) and only as required to perform those services or comply with law.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Device contacts</h2>
        <p>
          The mobile app may request access to contacts so participants can choose who to
          message for campaign outreach. Only contacts the user selects are sent to Company
          systems; we do not ingest the entire address book by default.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">SMS reminders</h2>
        <p>
          The service may send optional reminder texts only when a user opts in to the
          SMS program terms. Message cadence, STOP/HELP instructions, and consent language
          are published at <Link href="/sms-reminders" className="text-hh-primary underline">SMS reminders</Link>.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Retention</h2>
        <p>
          We retain information under data-minimization principles and legal requirements.
          Contact/outreach data may be minimized after campaign closeout, while records
          needed for financial operations, dispute handling, tax/accounting, and compliance
          may be retained for required periods.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Support and requests</h2>
        <p>
          For privacy questions, contact <a className="text-hh-primary underline" href="mailto:privacy@hearthustlefund.com">privacy@hearthustlefund.com</a>. For general support, contact <a className="text-hh-primary underline" href="mailto:support@hearthustlefund.com">support@hearthustlefund.com</a>.
        </p>
      </section>
    </div>
  );
}
