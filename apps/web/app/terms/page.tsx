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
        Last updated: April 25, 2026. These terms are a plain-language summary
        of how we expect the platform to be used.{" "}
        <strong>Heart and Hustle Fundraising LLC</strong> (also referred to as
        {BRAND.name}) operates the Service. The full{" "}
        <strong>Fundraising Services Agreement</strong> for approved schools and
        organizations (revenue share, eligibility, and other program terms) is
        <strong> not posted publicly</strong> — it is provided for signature
        (with a W-9 and any other required paperwork) when a program is
        approved. The sections below, together with our{" "}
        <Link href="/privacy" className="text-hh-primary underline">
          Privacy policy
        </Link>
        , are written to reflect the same material commitments you will see in
        that program agreement. For legal questions, consult counsel.
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
          where practicable. We are a registered{" "}
          <strong>Professional Fund Raiser</strong> with the Illinois
          Attorney General&apos;s Office and conduct activities in line with the
          Illinois Solicitation for Charity Act (225 ILCS 460).
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
          partner, <strong>Stripe, Inc.</strong>, under its terms and privacy
          practices. We do <strong>not</strong> store full card numbers on our
          systems.
        </p>
        <p>
          <strong>Company is not a charity.</strong> Heart and Hustle
          Fundraising LLC is a registered Professional Fund Raiser; it is{" "}
          <strong>not</strong> a tax-exempt charitable organization under
          section 501(c)(3) or otherwise. <strong>Tax deductibility</strong> of
          any payment depends on the receiving organization&apos;s status and the
          donor&apos;s own tax situation; we do not provide tax, legal, or
          financial advice. Donors and organizations should consult a qualified
          professional. A Stripe or card receipt confirms that a{" "}
          <strong>payment was processed</strong> and, by itself, is{" "}
          <strong>not</strong> a charitable contribution acknowledgment or a
          representation of deductibility, consistent with the program agreement
          for organizations that run paid-out campaigns.
        </p>
        <p>
          For <strong>participating organizations</strong> with paid-out
          program campaigns, <strong>net</strong> raised funds are shared{" "}
          <strong>90% to the organization and 10% to Company</strong> as its
          service fee. <strong>Payment processing and card fees</strong> are{" "}
          <strong>Company&apos;s</strong> responsibility and are{" "}
          <strong>not deducted from the organization&apos;s 90% share</strong>.
          Refunds and chargebacks are handled according to applicable payment
          rules and program instructions.
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
          or undelivered messages. Organizations are responsible for participant
          communications, including modified messages, as in the program
          agreement.
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
          or (b) one hundred U.S. dollars. <strong>Participating
          organizations</strong> are also subject to the stricter, platform-scoped
          limitation of liability in the Fundraising Services Agreement
          (executed when the program is approved) where it governs the program
          relationship.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Indemnity</h2>
        <p>
          You agree to defend and indemnify us against claims arising from your
          misuse of the Service, your campaign content, or your violation of
          these terms or applicable law, except to the extent caused by our gross
          negligence or willful misconduct. <strong>Participating
          organizations</strong> have additional indemnification and
          hold-harmless obligations in the Fundraising Services Agreement
          provided for signature with the program, where that agreement
          applies.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Changes</h2>
        <p>
          We may update these terms. We will post the revised date at the top of
          this page. Continued use after changes constitutes acceptance of the
          updated terms.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">
          Participating organizations
        </h2>
        <p>
          If your school or program is <strong>approved</strong> to run a
          paid-out campaign, you will receive a <strong>Fundraising Services
          Agreement</strong> (not published here) to sign, together with a W-9
          and any other required documents. That agreement governs, among other
          things, <strong>eligibility tiers</strong>, the <strong>90/10
          split</strong>, that <strong>sponsor-set dates and goals</strong> (we
          do not run your campaign for you), <strong>participant
          communications and templates</strong>, <strong>payments and use of
          funds</strong>, <strong>tax representations</strong>, and <strong>data
          use</strong> (aligned with this page and the Privacy policy). If
          anything in these public terms and the written program agreement
          conflict for a program relationship, the <strong>signed program
          agreement</strong> controls.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a
            className="text-hh-primary underline"
            href="mailto:support@hearthustlefund.com"
          >
            support@hearthustlefund.com
          </a>
          . Privacy-related requests:{" "}
          <a
            className="text-hh-primary underline"
            href="mailto:privacy@hearthustlefund.com"
          >
            privacy@hearthustlefund.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
