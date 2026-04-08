import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-slate-700">
      <Link href="/" className="text-sm text-hh-primary hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-hh-dark">Terms of service</h1>
      <p className="mt-2 text-sm text-slate-500">{BRAND.name}</p>
      <p className="mt-4 text-xs text-slate-500">
        Last updated: April 8, 2026. These terms are a plain-language summary of
        how we expect the platform to be used. For legal questions, consult
        counsel.
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-hh-dark">Agreement</h2>
        <p>
          By accessing {BRAND.name} (the &quot;Service&quot;)—including our
          website, coach tools, donation pages, and related mobile
          experiences—you agree to these Terms of Service and our{" "}
          <Link href="/privacy" className="text-hh-primary underline">
            Privacy policy
          </Link>
          . If you do not agree, do not use the Service.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">The Service</h2>
        <p>
          We provide software and workflows for schools, clubs, and programs to
          run fundraising campaigns: participant links, donations processed
          through third-party payment providers, and optional messaging
          features. We may change or discontinue features with reasonable notice
          where practicable.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Accounts &amp; eligibility</h2>
        <p>
          Coaches and authorized program representatives create and manage
          campaigns. Participants join with accurate information. You are
          responsible for safeguarding login credentials and for activity under
          your account. You must be able to form a binding contract in your
          jurisdiction to use the Service in a capacity that commits your
          organization.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Donations</h2>
        <p>
          Donations are voluntary. Payment processing is handled by our payment
          partner (e.g. Stripe) under its terms and privacy practices. Platform
          and processing fees may apply as disclosed at checkout or in campaign
          materials. Refunds and chargebacks are handled according to applicable
          policies, payment network rules, and program instructions.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">SMS &amp; communications</h2>
        <p>
          Where the Service offers optional text reminders or notifications,
          recipients who provide a mobile number consent to receive
          campaign-related messages at that number. Message frequency is
          disclosed in the app (for example, periodic reminders during an active
          campaign). Message and data rates may apply. You can opt out of
          marketing texts where applicable by following instructions in the
          message; for transactional messages, contact support or adjust
          settings in the app where available. Carriers are not liable for delayed
          or undelivered messages.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Acceptable use</h2>
        <p>
          You will not use the Service to violate law, harass others, send
          unsolicited bulk messages without proper consent, misrepresent a
          campaign, or attempt to access data or systems you are not authorized
          to use. You are responsible for compliance with school, district, and
          applicable fundraising regulations.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Content &amp; data</h2>
        <p>
          You retain rights to content you submit. You grant us a license to
          host, process, and display that content as needed to operate the
          Service. Our use of personal data is described in the{" "}
          <Link href="/privacy" className="text-hh-primary underline">
            Privacy policy
          </Link>
          .
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Disclaimers</h2>
        <p>
          The Service is provided &quot;as is&quot; without warranties of any
          kind, whether express or implied, including merchantability or fitness
          for a particular purpose. We do not guarantee uninterrupted or
          error-free operation.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, {BRAND.name} and its operators
          are not liable for indirect, incidental, special, consequential, or
          punitive damages, or for loss of profits, data, or goodwill, arising
          from your use of the Service. Our aggregate liability for claims
          relating to the Service is limited to the greater of (a) amounts you
          paid us in fees for the Service in the twelve months before the claim
          or (b) one hundred U.S. dollars.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Indemnity</h2>
        <p>
          You agree to defend and indemnify us against claims arising from your
          misuse of the Service, your campaign content, or your violation of
          these terms or applicable law, except to the extent caused by our gross
          negligence or willful misconduct.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Changes</h2>
        <p>
          We may update these terms. We will post the revised date at the top of
          this page. Continued use after changes constitutes acceptance of the
          updated terms.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a
            className="text-hh-primary underline"
            href="mailto:privacy@heartandhustle.com"
          >
            privacy@heartandhustle.com
          </a>{" "}
          (or the contact address we publish on the site).
        </p>
      </section>
    </div>
  );
}
