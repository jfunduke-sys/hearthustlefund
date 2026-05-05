import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Donor terms of service",
  description:
    "Terms governing donor interactions and checkout flows on Heart & Hustle donation pages.",
  alternates: { canonical: "/donor-terms" },
};

export default function DonorTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-slate-700">
      <Link href="/" className="text-sm text-hh-primary hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-hh-dark">Donor terms of service</h1>
      <p className="mt-2 text-sm text-slate-500">
        {BRAND.name}
        <span className="text-slate-400"> · </span>
        <Link href="/donor-privacy" className="text-hh-primary hover:underline">
          Donor privacy policy
        </Link>
      </p>
      <p className="mt-4 text-xs text-slate-500">
        Last updated: May 5, 2026. These terms apply to donor-side interactions on
        donation landing pages and checkout.
      </p>

      <section className="mt-8 space-y-5 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-hh-dark">1. Scope</h2>
          <p className="mt-2">
            These terms govern donations made through Heart & Hustle donation pages,
            including payment entry, checkout, receipts, and donor-side confirmation
            pages. Organization operating terms are separate at <Link href="/terms" className="text-hh-primary underline">/terms</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-hh-dark">2. Payment processing</h2>
          <p className="mt-2">
            Payments are processed by Stripe, Inc. Heart & Hustle does not store full
            card numbers. Donation completion is subject to processor rules, fraud checks,
            and issuer approval.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-hh-dark">3. Tax-deductibility and acknowledgments</h2>
          <p className="mt-2">
            Heart &amp; Hustle Fundraising LLC is a registered Professional Fund Raiser
            and is not itself a charitable organization or tax-exempt entity under
            Section 501(c)(3). Heart &amp; Hustle makes no representation or warranty that
            any donation is tax deductible.
          </p>
          <p className="mt-2">
            Tax treatment depends on the receiving Organization&apos;s status and each
            donor&apos;s circumstances. Donors should consult their tax advisor.
            Processor receipts (for example from Stripe) confirm payment processing only
            and are not charitable contribution acknowledgments.
          </p>
          <p className="mt-2">
            Any legally required charitable acknowledgments are the sole responsibility
            of the receiving Organization.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-hh-dark">4. Refunds, chargebacks, and disputes</h2>
          <p className="mt-2">
            Donation disputes should be directed to support at first instance.
            Chargebacks and payment reversals are handled under processor and card-network
            rules. Heart & Hustle may provide transaction records needed to investigate
            disputes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-hh-dark">5. Acceptable use</h2>
          <p className="mt-2">
            Donors may not use donation pages for fraud, unauthorized card use, abuse,
            scraping, attacks, or any unlawful activity.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-hh-dark">6. Limitation of liability</h2>
          <p className="mt-2">
            To the fullest extent permitted by law, Heart & Hustle is not liable for
            indirect, incidental, consequential, special, or punitive damages arising out
            of donor-side use of donation pages or payment services.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-hh-dark">7. Contact</h2>
          <p className="mt-2">
            Support: <a className="text-hh-primary underline" href="mailto:support@hearthustlefund.com">support@hearthustlefund.com</a>
            . Privacy: <a className="text-hh-primary underline" href="mailto:privacy@hearthustlefund.com">privacy@hearthustlefund.com</a>.
          </p>
        </section>
      </section>
    </div>
  );
}
