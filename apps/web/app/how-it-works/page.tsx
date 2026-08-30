import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteHeader } from "@/components/marketing-site-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingPhoto } from "@/components/marketing-photo";
import { BRAND } from "@/lib/brand";
import { HowToJsonLd } from "@/components/howto-json-ld";
import { marketingSocial } from "@/lib/marketing-seo";

const howItWorksTitle = "How 100% Return School Fundraising Works";
const howItWorksDescription =
  "How Heart & Hustle 100% return sports and school fundraising works—from your request and Illinois paperwork through campaign launch, donations, and payout to your program.";

export const metadata: Metadata = {
  title: howItWorksTitle,
  description: howItWorksDescription,
  alternates: { canonical: "/how-it-works" },
  ...marketingSocial(howItWorksTitle, howItWorksDescription, "/how-it-works"),
};

const STEPS: {
  title: string;
  summary: string;
  detail: string;
}[] = [
  {
    title: "Request a fundraiser",
    summary:
      "The Organizer (coach, sponsor, or lead fundraising contact) submits one intake form for the school program.",
    detail:
      "Usually the Head Organizer or fundraising contact completes the form with school and district details. Their email is the one Heart & Hustle ties to the HH campaign setup code. School administration typically signs required Illinois paperwork when Heart & Hustle sends it—not necessarily the person who submitted this form.",
  },
  {
    title: "Compliance & Illinois paperwork",
    summary: "We review every request and complete required steps before any campaign goes live.",
    detail:
      "Heart & Hustle follows Illinois-oriented compliance practices. Required paperwork is sent, collected, and verified. Requests remain pending until this step is satisfied.",
  },
  {
    title: "Approval & campaign setup code",
    summary:
      "Approved programs receive a one-time HH campaign setup code tied to the Organizer’s email.",
    detail:
      "Heart & Hustle emails the code to the Organizer (or your team’s designated contact). That code is only for creating the campaign on the website—not for participants joining in the app.",
  },
  {
    title: "Organizer activates & builds the campaign",
    summary:
      "The Organizer opens Organizer login, enters their email and code, creates a password, then completes fundraiser details.",
    detail:
      "On the website they use Organizer login → Start with my code: same email the code was assigned to, the HH code, then a password they’ll use on return visits. After that they enter school and team info, goals, dates, and optional logos. When the campaign is active, the platform assigns a 7-character team join code for participants (plus an optional legacy web link for bookmarks).",
  },
  {
    title: "Participants join & share",
    summary:
      "Participants join in the mobile app with the 7-character team code from their Organizer.",
    detail:
      "Each participant gets a personal donation link. Contacts and reminder texting use the same participant model whether someone uses the mobile app or the web—one record per person per campaign.",
  },
  {
    title: "Donations & tracking",
    summary:
      "Supporters donate through secure checkout; progress is visible to Organizers and participants.",
    detail:
      "Donations are processed through Stripe. The campaign dashboard shows raised amounts and activity so the team can see momentum through the end date.",
  },
  {
    title: "Campaign closes",
    summary: "When the scheduled end date passes, fundraising for that campaign is complete.",
    detail:
      "Final totals are available in the Organizer dashboard. After the campaign ends, Heart & Hustle prepares the program’s share for payout as described in the Terms of service.",
  },
  {
    title: "Payout to your program",
    summary:
      "Heart & Hustle initiates disbursement of the program’s share after Stripe-cleared funds are available.",
    detail:
      "Subject to a W-9 and executed agreement on file, Company initiates disbursement of the organization’s share within three (3) business days after applicable funds have cleared through Stripe’s payment processing (settled and available for payout), in the manner described in the Terms of service — including bank timing, verification, and chargeback holds. See Terms of service (Section 7) for the full payout terms.",
  },
];

function StepBlock({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  return (
    <li className="grid gap-4 border-t border-black/10 py-10 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-8 sm:py-14">
      <p className="font-display text-3xl font-medium tabular-nums text-hh-primary sm:text-4xl">
        {String(index + 1).padStart(2, "0")}
      </p>
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-medium tracking-tight text-hh-dark sm:text-3xl">
          {step.title}
        </h2>
        <p className="mt-3 text-base font-medium leading-relaxed text-hh-dark">
          {step.summary}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
          {step.detail}
        </p>
      </div>
    </li>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="hh-paper min-h-screen">
      <HowToJsonLd steps={STEPS} />
      <section className="relative min-h-[22rem] overflow-hidden sm:min-h-[28rem] lg:min-h-[32rem]">
        <MarketingSiteHeader overlay />
        <MarketingPhoto
          src="/marketing/stadium-bleachers.jpg"
          alt="Community athletic field and bleachers at dusk"
          className="absolute inset-0"
          imageClassName="object-[center_30%] saturate-[.5] brightness-[.55]"
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/75"
          aria-hidden
        />
        <div className="hh-grain absolute inset-0" aria-hidden />
        <div className="relative z-[2] mx-auto flex min-h-[22rem] max-w-[90rem] flex-col justify-end px-4 pb-10 pt-28 sm:min-h-[28rem] sm:px-8 sm:pb-14 lg:min-h-[32rem] lg:px-10 lg:pt-36">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75 sm:text-xs">
            End-to-end overview
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-white sm:text-6xl">
            How a school fundraiser works
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            From your first school request through the day we hand off your
            program’s share, here is the full path for {BRAND.name} campaigns in
            Illinois school programs.
          </p>
        </div>
      </section>

      <main>
        <ol className="mx-auto max-w-4xl px-4 sm:px-8 lg:px-10">
          {STEPS.slice(0, 3).map((step, i) => (
            <StepBlock key={step.title} step={step} index={i} />
          ))}
        </ol>

        <div className="relative my-4">
          <MarketingPhoto
            src="/marketing/gym.jpg"
            alt="Empty running track"
            className="h-44 sm:h-64 lg:h-80"
            mono
          />
          <div className="hh-grain absolute inset-0" aria-hidden />
        </div>

        <ol className="mx-auto max-w-4xl px-4 sm:px-8 lg:px-10" start={4}>
          {STEPS.slice(3, 6).map((step, i) => (
            <StepBlock key={step.title} step={step} index={i + 3} />
          ))}
        </ol>

        <section className="grid lg:grid-cols-12">
          <MarketingPhoto
            src="/marketing/baseball.jpg"
            alt="Football field with goalposts and bleachers"
            className="min-h-[16rem] sm:min-h-[22rem] lg:col-span-5 lg:min-h-full"
            imageClassName="object-[center_70%]"
            sizes="(min-width: 1024px) 42vw, 100vw"
          />
          <ol className="px-4 sm:px-8 lg:col-span-7 lg:px-12" start={7}>
            {STEPS.slice(6).map((step, i) => (
              <StepBlock key={step.title} step={step} index={i + 6} />
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-8 sm:py-24">
          <h2 className="font-display text-3xl font-medium tracking-tight text-hh-dark sm:text-4xl">
            Ready to begin?
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-700">
            Schools start with a request. Approved Organizers use{" "}
            <strong>Organizer login</strong> with their emailed code the first
            time, then email and password after that.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/request-fundraiser"
              className="inline-flex items-center bg-hh-primary px-6 py-3 text-sm font-medium tracking-[0.04em] text-white hover:bg-[#a33225]"
            >
              Request a fundraiser
            </Link>
            <Link
              href="/coach/login"
              className="inline-flex items-center border border-hh-dark px-6 py-3 text-sm font-medium tracking-[0.04em] text-hh-dark hover:bg-hh-dark hover:text-white"
            >
              Organizer login
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter includeSms={false} />
    </div>
  );
}
