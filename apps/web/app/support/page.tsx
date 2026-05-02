import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteHeader } from "@/components/marketing-site-header";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hearthustlefund.com";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Contact Heart & Hustle Fundraising for help with the app, campaigns, and accounts. Privacy, terms, and SMS program information.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingSiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-hh-primary">
          Help
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-hh-dark sm:text-4xl">
          Support
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Questions about the mobile app, your account, or a fundraiser? Email
          us and we&apos;ll get back to you as soon as we can.
        </p>
        <p className="mt-6">
          <a
            className="text-base font-semibold text-hh-primary underline underline-offset-2 hover:text-hh-primary/90"
            href={`mailto:${SUPPORT_EMAIL}`}
          >
            {SUPPORT_EMAIL}
          </a>
        </p>

        <h2 className="mt-12 text-lg font-semibold text-hh-dark">
          Policies and notices
        </h2>
        <ul className="mt-4 list-inside list-disc space-y-3 text-base text-slate-700">
          <li>
            <Link
              href="/privacy"
              className="text-hh-primary underline underline-offset-2 hover:text-hh-primary/90"
            >
              Privacy policy
            </Link>
          </li>
          <li>
            <Link
              href="/terms"
              className="text-hh-primary underline underline-offset-2 hover:text-hh-primary/90"
            >
              Terms of service
            </Link>
          </li>
          <li>
            <Link
              href="/sms-reminders"
              className="text-hh-primary underline underline-offset-2 hover:text-hh-primary/90"
            >
              SMS program — fundraising reminder texts
            </Link>
          </li>
        </ul>

        <p className="mt-10 text-center text-sm text-slate-500">
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>
        </p>
      </main>
    </div>
  );
}
