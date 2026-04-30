import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import {
  FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION,
  FundraisingServicesAgreementBody,
} from "@/lib/fundraising-services-agreement-document";

const pfrReg =
  process.env.NEXT_PUBLIC_IL_PFR_REGISTRATION_NUMBER?.trim() || "[YOUR NUMBER]";

export const metadata: Metadata = {
  title: `Terms of service — ${BRAND.name}`,
  description:
    "Heart and Hustle Fundraising LLC — Fundraising Services Agreement (terms of service).",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-slate-700">
      <Link href="/" className="text-sm text-hh-primary hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-hh-dark">Terms of service</h1>
      <p className="mt-2 text-sm text-slate-500">
        {BRAND.name}
        <span className="text-slate-400"> · </span>
        <Link href="/privacy" className="text-hh-primary hover:underline">
          Privacy policy
        </Link>
      </p>
      <p className="mt-4 text-xs text-slate-500">
        Last updated: April 25, 2026. This page is the published{" "}
        <strong>Fundraising Services Agreement</strong> of Heart and Hustle
        Fundraising LLC (the &quot;Company&quot;). It serves as the{" "}
        <strong>terms of service</strong> for use of our platform and program.
        Document version{" "}
        <span className="font-mono">{FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION}</span>
        . Approved organizations also execute a signed copy with a W-9 for
        payouts. Personal data practices are in our separate{" "}
        <Link href="/privacy" className="text-hh-primary underline">
          Privacy policy
        </Link>
        . Participant SMS disclosures (opt-in, frequency, STOP/HELP):{" "}
        <Link href="/sms-reminders" className="text-hh-primary underline">
          SMS reminders
        </Link>
        .
      </p>

      <div className="mt-8 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-center text-xl font-bold tracking-tight text-hh-dark sm:text-2xl">
          HEART AND HUSTLE FUNDRAISING LLC
        </h2>
        <p className="mt-2 text-center text-lg font-bold text-hh-dark">
          FUNDRAISING SERVICES AGREEMENT
        </p>
        <FundraisingServicesAgreementBody
          pfrReg={pfrReg}
          privacyPolicyHref="/privacy"
        />
      </div>

      <p className="mt-10 text-center text-sm text-slate-500">
        Questions:{" "}
        <a className="text-hh-primary underline" href="mailto:support@hearthustlefund.com">
          support@hearthustlefund.com
        </a>
        . Privacy:{" "}
        <a className="text-hh-primary underline" href="mailto:privacy@hearthustlefund.com">
          privacy@hearthustlefund.com
        </a>
        .
      </p>
    </div>
  );
}
