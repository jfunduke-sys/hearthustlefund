import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteHeader } from "@/components/marketing-site-header";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";

const homeDescription =
  "Built for youth organizations and school teams — simple donations, 90% to your program, zero data selling. Heart & Hustle Fundraising.";

export const metadata: Metadata = {
  title: { absolute: BRAND.name },
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: BRAND.name,
    description: homeDescription,
    url: "/",
  },
  twitter: {
    title: BRAND.name,
    description: homeDescription,
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingSiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-4 sm:py-24">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-hh-dark sm:text-5xl">
          Built by Heart. Powered by Hustle.
        </h1>
        <p className="mt-4 max-w-3xl text-balance text-lg font-semibold leading-relaxed text-slate-800 sm:text-xl lg:max-w-none lg:text-nowrap">
          Safe fundraising for youth organizations, nonprofit groups, and
          school teams, clubs, and activities.
        </p>
        <ul className="mt-8 max-w-2xl space-y-3 text-base text-slate-700 sm:text-lg">
          <li className="flex gap-3">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hh-primary"
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-hh-dark">90%</strong> of
              donations go to your program
              <span className="font-semibold text-hh-dark" aria-hidden="true">
                *
              </span>
              .
            </span>
          </li>
          <li className="flex gap-3">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hh-primary"
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-hh-dark">Zero data selling</strong>{" "}
              — donor and participant information stays in your campaign.
            </span>
          </li>
          <li className="flex gap-3">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hh-primary"
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-hh-dark">
                Quick payouts
              </strong>{" "}
              — after donations clear through Stripe, funds typically reach your
              program within about 2–3 business days.
            </span>
          </li>
          <li className="flex gap-3">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hh-primary"
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-hh-dark">
                Locally built, community driven.
              </strong>
            </span>
          </li>
        </ul>
        <p
          className="mt-4 max-w-2xl text-sm italic leading-relaxed text-slate-500 sm:text-[15px]"
          role="note"
        >
          <span className="sr-only">Regarding the 90% figure: </span>* We keep{" "}
          <strong>10%</strong> to run a safe, compliant platform—payment processing,
          Illinois registration, bonding, and day-to-day operations.{" "}
          <strong>90%</strong> stays with your program. No hidden fees. We don&apos;t
          sell donor or participant data.
        </p>
        <section className="mt-12 max-w-3xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-hh-dark sm:text-2xl">
            Why schools and clubs choose {BRAND.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Most fundraising platforms take a hidden cut, push products nobody
            asked for, or turn your participants and donors into a marketing list
            for sale. We don&apos;t. Whether you run youth or high school sports,
            clubs, or activities through a school district or a standalone club,
            Heart &amp; Hustle follows one rule: the program comes first.
          </p>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
            <li>
              <p className="font-semibold text-hh-dark">More for your program</p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                <strong>90%</strong> of donations go to your program; our{" "}
                <strong>10%</strong> share keeps the platform running—secure
                checkout, Illinois compliance, and support—without layering hidden
                fees on your team&apos;s slice.
              </p>
            </li>
            <li>
              <p className="font-semibold text-hh-dark">Privacy you can stand behind</p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                We don&apos;t sell donor or participant data. Supporters give to the
                team—not to a marketplace built on reselling leads.
              </p>
            </li>
            <li>
              <p className="font-semibold text-hh-dark">Built for teams and clubs, not catalogs</p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                Personal donation links and optional texting replace order forms,
                deliveries, and quota pressure—so Organizers and advisors focus on
                participants.
              </p>
            </li>
            <li>
              <p className="font-semibold text-hh-dark">Quick payouts</p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                We initiate disbursement within three business days after
                applicable donations have cleared through Stripe; you often see
                funds in about 2–3 business days after that clearance (payout
                timing is described in Section 7 of our terms of service).
              </p>
            </li>
            <li>
              <p className="font-semibold text-hh-dark">Local, not faceless</p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                The platform is built and operated locally—you work with real
                people who understand schools and clubs, not an anonymous national
                help desk.
              </p>
            </li>
          </ul>
        </section>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button size="lg" asChild>
            <Link href="/request-fundraiser">Request Fundraiser</Link>
          </Button>
        </div>
        <p className="mt-14 text-center text-sm text-slate-500">
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy policy
          </Link>
          <span className="mx-2 text-slate-300" aria-hidden>
            ·
          </span>
          <Link href="/terms" className="underline underline-offset-2">
            Terms of service
          </Link>
          <span className="mx-2 text-slate-300" aria-hidden>
            ·
          </span>
          <Link href="/sms-reminders" className="underline underline-offset-2">
            SMS reminders
          </Link>
        </p>
      </main>
    </div>
  );
}
