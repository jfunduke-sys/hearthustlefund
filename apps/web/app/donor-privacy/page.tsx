import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Donor privacy policy",
  description:
    "Privacy policy for donor interactions on Heart & Hustle donation pages and checkout.",
  alternates: { canonical: "/donor-privacy" },
};

export default function DonorPrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-slate-700">
      <Link href="/" className="text-sm text-hh-primary hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-hh-dark">Donor privacy policy</h1>
      <p className="mt-2 text-sm text-slate-500">
        {BRAND.name}
        <span className="text-slate-400"> · </span>
        <Link href="/donor-terms" className="text-hh-primary hover:underline">
          Donor terms of service
        </Link>
      </p>
      <p className="mt-4 text-xs text-slate-500">
        This policy applies only to donor-side pages and checkout flows.
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-hh-dark">What we collect from donors</h2>
        <p>
          Depending on page options, donor-side interactions may include donation
          amount, optional display name, optional email, optional phone, payment
          metadata, and transaction identifiers.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">How donor data is used</h2>
        <p>
          Donor data is used to process payments, detect fraud, support customer
          service, maintain transaction records, and meet legal/accounting obligations.
          We also provide relevant transaction and campaign reporting data to the
          receiving Organization operating the fundraiser.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Payment processor</h2>
        <p>
          Card entry and processing are handled by Stripe, Inc. under PCI-compliant
          workflows. Heart & Hustle does not store full card numbers.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Data sharing and sale</h2>
        <p>
          We do <strong>not</strong> sell donor personal data. We share donor data only
          with service providers necessary to process donations and run the platform,
          and where required by law.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Retention</h2>
        <p>
          Donation records are retained as required for operations, accounting,
          fraud/dispute handling, and legal compliance.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Contact</h2>
        <p>
          Privacy requests: <a className="text-hh-primary underline" href="mailto:privacy@hearthustlefund.com">privacy@hearthustlefund.com</a>
          . Support: <a className="text-hh-primary underline" href="mailto:support@hearthustlefund.com">support@hearthustlefund.com</a>.
        </p>
      </section>
    </div>
  );
}
