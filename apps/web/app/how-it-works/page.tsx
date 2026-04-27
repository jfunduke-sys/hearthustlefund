import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteHeader } from "@/components/marketing-site-header";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: `How it works — ${BRAND.name}`,
  description:
    "From school request through campaign launch, donations, and program payout — the Heart & Hustle Fundraising flow.",
};

const STEPS: {
  title: string;
  summary: string;
  detail: string;
}[] = [
  {
    title: "Request a fundraiser",
    summary: "The coach or team lead submits one intake form for the school program.",
    detail:
      "Usually the head coach or fundraising contact completes the form with school and district details. Their email is the one Heart & Hustle ties to the HH campaign setup code. School administration typically signs required Illinois paperwork when Heart & Hustle sends it—not necessarily the person who submitted this form.",
  },
  {
    title: "Compliance & Illinois paperwork",
    summary: "We review every request and complete required steps before any campaign goes live.",
    detail:
      "Heart & Hustle follows Illinois-oriented compliance practices. Required paperwork is sent, collected, and verified. Requests remain pending until this step is satisfied.",
  },
  {
    title: "Approval & campaign setup code",
    summary: "Approved programs receive a one-time HH campaign setup code tied to the lead coach’s email.",
    detail:
      "Heart & Hustle emails the code to the coach (or your team’s contact). That code is only for creating the campaign in the coach portal—not for athletes joining as participants.",
  },
  {
    title: "Coach activates & builds the campaign",
    summary: "The coach opens Coach login, enters their email and code, creates a password, then completes fundraiser details.",
    detail:
      "On the website they use Coach login → Start with my code: same email the code was assigned to, the HH code, then a password they’ll use on return visits. After that they enter school and team info, goals, dates, and optional logos. When the campaign is active, the platform assigns a 7-character team join code for athletes (plus an optional legacy web link for bookmarks).",
  },
  {
    title: "Participants join & share",
    summary: "Athletes join in the mobile app with the 7-character team code from their coach.",
    detail:
      "Each participant gets a personal donation link. Contacts and reminder texting use the same participant model whether someone uses the mobile app or the web—one record per person per campaign.",
  },
  {
    title: "Donations & tracking",
    summary: "Supporters donate through secure checkout; progress is visible to coaches and participants.",
    detail:
      "Donations are processed through Stripe. The campaign dashboard shows raised amounts and activity so the team can see momentum through the end date.",
  },
  {
    title: "Campaign closes",
    summary: "When the scheduled end date passes, fundraising for that campaign is complete.",
    detail:
      "Final totals are available in the coach dashboard. The program share is determined according to your stated allocation (for example, ninety percent to the school athletic program, with platform fees covering processing).",
  },
  {
    title: "Payout to your program",
    summary: "Heart & Hustle settles the program’s share and delivers it in person.",
    detail:
      "After reconciliation, Heart & Hustle provides the school or program’s portion by check. A Heart & Hustle representative coordinates delivery so your booster club or athletic department receives funds directly—no guesswork on when or how the school gets paid.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingSiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-hh-primary">
          End-to-end overview
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-hh-dark sm:text-4xl">
          How it works
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          From your first school request through the day we hand off your program’s
          share, here is the full path for {BRAND.name} campaigns in Illinois
          school programs.
        </p>

        <ol className="mt-12 space-y-0">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative border-l-2 border-hh-primary/25 pb-12 pl-8 last:border-l-transparent last:pb-0 sm:pl-10"
            >
              <span
                className="absolute -left-[15px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-hh-primary bg-white text-sm font-bold text-hh-primary shadow-sm sm:-left-[17px] sm:h-9 sm:w-9"
                aria-hidden
              >
                {i + 1}
              </span>
              <h2 className="text-xl font-semibold text-hh-dark">{step.title}</h2>
              <p className="mt-1 text-sm font-medium text-slate-700">{step.summary}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-hh-dark">Ready to begin?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Schools start with a request. Approved coaches use{" "}
            <strong>Coach login</strong> with their emailed code the first time,
            then email and password after that.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/request-fundraiser">Request a fundraiser</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/coach/login">Coach login</Link>
            </Button>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy policy
          </Link>
          <span className="mx-2 text-slate-300" aria-hidden>
            ·
          </span>
          <Link href="/terms" className="underline underline-offset-2">
            Terms of service
          </Link>
        </p>
      </main>
    </div>
  );
}
