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
        {BRAND.name}
        <span className="text-slate-400"> · </span>
        <Link href="/terms" className="text-hh-primary hover:underline">
          Terms of service
        </Link>
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
          We do not sell personal data. We do not use donor or athlete data for
          advertising. We do not share contact lists with third parties beyond
          what is required to operate payments (Stripe) and hosting/auth
          (Supabase) under their terms.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Payments (Stripe)</h2>
        <p>
          Card and payment details are handled by Stripe under PCI-compliant
          flows. We store donation amounts and optional donor fields needed for
          receipts and campaign reporting—not full card numbers.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Device contacts</h2>
        <p>
          The mobile app may request access to your contacts only so you can
          pick recipients for fundraising texts. Only contacts you select are
          sent to our servers (name and phone), to support reminder flows—not
          your entire address book.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Donor anonymity</h2>
        <p>
          Donors may give anonymously where the product supports it; anonymous
          donations may omit display names in athlete and coach views while
          still recording the financial transaction.
        </p>

        <h2 className="text-lg font-semibold text-hh-dark">Retention</h2>
        <p>
          We retain records as needed for compliance, dispute resolution, and
          campaign accounting. Contact{" "}
          <a
            className="text-hh-primary underline"
            href="mailto:privacy@hearthustlefund.com"
          >
            privacy@hearthustlefund.com
          </a>{" "}
          for deletion requests where applicable.
        </p>
      </section>
    </div>
  );
}
