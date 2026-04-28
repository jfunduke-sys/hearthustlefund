import Link from "next/link";
import { BRAND } from "@/lib/brand";

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
        The <strong>Fundraising Services Agreement</strong> is published as our{" "}
        <Link href="/terms" className="text-hh-primary underline">
          Terms of service
        </Link>{" "}
        and includes program data-use terms (Section 9). This{" "}
        <strong>Privacy policy</strong> is the dedicated page for what we
        collect and how we use personal data; it is written to be{" "}
        <strong>consistent</strong> with that agreement.
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-hh-dark">What we collect</h2>
        <p>
          We collect information you provide to run fundraisers: athlete names
          and jersey numbers, school and team context, optional donor name and
          email for receipts, and phone numbers for contacts you explicitly
          choose to message through the app.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">What we do not do</h2>
        <p>
          We do <strong>not</strong> sell personal data. We do not use donor or
          participant data for third-party marketing or advertising. We share
          data only with service providers needed to run the platform (for
          example, payment processing and hosting/auth), and as required for
          legal, regulatory, and tax compliance—matching Section 9 of our{" "}
          <Link href="/terms" className="text-hh-primary underline">
            Terms of service
          </Link>{" "}
          (Fundraising Services Agreement) for approved program organizations.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Payments (Stripe)</h2>
        <p>
          Card and payment details are handled by Stripe, Inc. under
          PCI-compliant flows. We store donation amounts and optional donor
          fields needed for reporting—not full card numbers. Donors who provide
          an email may receive a <strong>payment receipt from Stripe</strong>;
          that receipt shows that a payment was processed. It is{" "}
          <strong>not</strong>, by itself, a charitable tax acknowledgment;
          that is the same position stated in our{" "}
          <Link href="/terms" className="text-hh-primary underline">
            Terms of service
          </Link>{" "}
          (Section 8). Eligible 501(c)(3) or other exempt
          organizations that receive funds are responsible for any donor
          acknowledgments required by law.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Device contacts</h2>
        <p>
          The mobile app may request access to your contacts only so you can
          pick recipients for fundraising texts. Only contacts you select are
          sent to our servers (name and phone), to support reminder flows—not
          your entire address book.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">
          Participant access lifecycle
        </h2>
        <p>
          Participant app access is campaign-specific. Participant accounts may
          remain available during an active campaign and any closeout period.
          When SuperAdmin finalizes closeout for a fundraiser (completed or
          cancelled), participant campaign access is removed for that fundraiser.
          Coaches maintain persistent portal accounts and can recover access via
          secure password-reset flow.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Donor anonymity</h2>
        <p>
          Donors may give anonymously where the product supports it; anonymous
          donations may omit display names in athlete and coach views while
          still recording the financial transaction.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Retention</h2>
        <p>
          We retain information according to data-minimization principles and our
          legal obligations. Outreach/contact list data is minimized after
          fundraiser closeout, while records needed for payment operations, tax,
          accounting, compliance, fraud prevention, and dispute resolution are
          retained for required periods under applicable law and contract terms.
          Contact{" "}
          <a
            className="text-hh-primary underline"
            href="mailto:privacy@hearthustlefund.com"
          >
            privacy@hearthustlefund.com
          </a>{" "}
          for privacy or deletion requests where applicable.
        </p>
      </section>
    </div>
  );
}
