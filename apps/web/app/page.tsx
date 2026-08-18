import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteHeader } from "@/components/marketing-site-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingPhoto } from "@/components/marketing-photo";
import { BRAND } from "@/lib/brand";
import { marketingSocial } from "@/lib/marketing-seo";

const homeTitle = `High School Fundraising Platform | ${BRAND.name}`;
const homeDescription =
  "Heart & Hustle is a high school fundraising platform for athletics, activities, and booster clubs. FERPA and COPPA compliant school fundraisers with personal donation links—no catalogs, no data selling. Also serving youth nonprofits and community programs in Illinois.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: "/" },
  ...marketingSocial(homeTitle, homeDescription, "/"),
};

export default function HomePage() {
  return (
    <div className="hh-paper min-h-screen overflow-x-hidden">
      <main>
        <section className="relative min-h-[100svh] overflow-hidden">
          <MarketingSiteHeader overlay />
          <MarketingPhoto
            src="/marketing/hero-night.jpg"
            alt="High school sports field under stadium lights at night"
            className="absolute inset-0"
            imageClassName="object-[center_35%] saturate-[.5] brightness-[.5] contrast-[1.05] sm:object-center"
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75"
            aria-hidden
          />
          <div className="hh-grain absolute inset-0" aria-hidden />
          <div className="relative z-[2] mx-auto flex min-h-[100svh] max-w-[90rem] flex-col justify-end px-4 pb-10 pt-28 sm:px-8 sm:pb-14 lg:px-10 lg:pb-20 lg:pt-36">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 sm:text-xs">
              Heart &amp; Hustle Fundraising
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-[2.35rem] font-medium leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Built by Heart. Powered by Hustle.
            </h1>
            <h2 className="mt-5 max-w-xl text-lg font-medium leading-snug text-white sm:text-2xl">
              The #1 fundraising platform for high school athletics, activities,
              and booster clubs.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
              Built for teams, clubs, and activities—and ready for youth
              nonprofits and other community programs that want the same simple,
              private fundraising.
            </p>
            <p
              className="mt-8 max-w-2xl text-sm font-semibold tracking-wide text-white sm:text-base"
              aria-label="Compliance and privacy"
            >
              FERPA compliant
              <span className="mx-2.5 text-white/55" aria-hidden>
                ·
              </span>
              COPPA compliant
              <span className="mx-2.5 text-white/55" aria-hidden>
                ·
              </span>
              We never sell data
            </p>
          </div>
        </section>

        <section className="grid lg:grid-cols-12">
          <div className="flex flex-col justify-center px-4 py-14 sm:px-8 sm:py-20 lg:col-span-5 lg:px-10 lg:py-24">
            <ul className="max-w-md space-y-8 text-base leading-relaxed text-neutral-700 sm:text-lg">
              <li>
                <strong className="font-semibold text-hh-dark">
                  Made for high schools
                </strong>{" "}
                — athletics, activities, and booster clubs first, with the same
                tools available to other nonprofits.
              </li>
              <li>
                <strong className="font-semibold text-hh-dark">
                  Zero data selling
                </strong>{" "}
                — student, donor, and participant information stays in your
                campaign.
              </li>
              <li>
                <strong className="font-semibold text-hh-dark">
                  Quick payouts
                </strong>{" "}
                — after donations clear through Stripe, funds typically reach
                your program within about 2–3 business days.
              </li>
              <li>
                <strong className="font-semibold text-hh-dark">
                  Locally built, community driven.
                </strong>
              </li>
            </ul>
          </div>
          <MarketingPhoto
            src="/marketing/gym.jpg"
            alt="Empty running track"
            className="min-h-[16rem] sm:min-h-[22rem] lg:col-span-7 lg:min-h-[36rem]"
            imageClassName="object-center"
            mono
            sizes="(min-width: 1024px) 58vw, 100vw"
          />
        </section>

        <section className="relative">
          <MarketingPhoto
            src="/marketing/football-field.jpg"
            alt="Empty soccer field at dusk"
            className="h-40 sm:h-56 lg:h-[22rem]"
            imageClassName="object-[center_40%] saturate-[.85]"
            sizes="100vw"
          />
          <div className="hh-grain absolute inset-0" aria-hidden />
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-8 sm:py-24 lg:px-10">
          <h2 className="font-display text-3xl font-medium tracking-tight text-hh-dark sm:text-5xl">
            Why high schools choose {BRAND.name}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-700 sm:text-lg">
            Most fundraising platforms take a hidden cut, push products nobody
            asked for, or turn your participants and donors into a marketing list
            for sale. We don&apos;t. Coaches, athletic directors, activity
            sponsors, and booster clubs get personal donation links—not catalogs
            and quota pressure. Youth nonprofits and other community groups can
            run the same kind of campaign.
          </p>
        </section>

        <section className="grid items-stretch lg:grid-cols-12">
          <MarketingPhoto
            src="/marketing/baseball.jpg"
            alt="Football field with goalposts and bleachers"
            className="min-h-[18rem] sm:min-h-[24rem] lg:col-span-7 lg:min-h-[32rem]"
            imageClassName="object-[center_60%]"
            sizes="(min-width: 1024px) 60vw, 100vw"
          />
          <div className="flex flex-col justify-center gap-12 px-4 py-12 sm:px-8 lg:col-span-5 lg:px-12 lg:py-16">
            <div className="max-w-sm">
              <p className="font-display text-2xl font-medium text-hh-dark">
                Built for teams, not catalogs
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Personal donation links and optional texting replace order forms,
                deliveries, and quota pressure—so Organizers and advisors focus
                on participants.
              </p>
            </div>
            <div className="max-w-sm">
              <p className="font-display text-2xl font-medium text-hh-dark">
                Privacy you can stand behind
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                FERPA and COPPA compliant. We don&apos;t sell student, donor, or
                participant data. Supporters give to the team—not to a
                marketplace built on reselling leads.
              </p>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-12">
          <div className="order-2 flex flex-col justify-center gap-12 px-4 py-12 sm:px-8 lg:order-1 lg:col-span-5 lg:px-12 lg:py-16">
            <div className="max-w-sm">
              <p className="font-display text-2xl font-medium text-hh-dark">
                Quick payouts
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                We initiate disbursement within three business days after
                applicable donations have cleared through Stripe; you often see
                funds in about 2–3 business days after that clearance (payout
                timing is described in Section 7 of our terms of service).
              </p>
            </div>
            <div className="max-w-sm">
              <p className="font-display text-2xl font-medium text-hh-dark">
                Local, not faceless
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Heart &amp; Hustle is built and operated in Illinois. You work
                with people who know Illinois high schools, booster clubs, and
                community programs—not an anonymous national help desk.
              </p>
            </div>
          </div>
          <MarketingPhoto
            src="/marketing/stadium-bleachers.jpg"
            alt="Community athletic field and bleachers at dusk"
            className="order-1 min-h-[16rem] sm:min-h-[22rem] lg:order-2 lg:col-span-7 lg:min-h-[34rem]"
            imageClassName="object-[center_35%]"
            mono
            sizes="(min-width: 1024px) 58vw, 100vw"
          />
        </section>

        <section className="relative min-h-[22rem] overflow-hidden sm:min-h-[28rem] lg:min-h-[36rem]">
          <MarketingPhoto
            src="/marketing/sports-fields.jpg"
            alt="High school sports fields"
            className="absolute inset-0"
            imageClassName="object-cover object-center saturate-[.7] brightness-[.6]"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25"
            aria-hidden
          />
          <div className="hh-grain absolute inset-0" aria-hidden />
          <div className="relative z-[2] flex min-h-[22rem] max-w-xl flex-col justify-end px-4 py-12 sm:min-h-[28rem] sm:px-8 lg:min-h-[36rem] lg:px-10 lg:py-16">
            <Link
              href="/request-fundraiser"
              className="inline-flex w-fit items-center bg-hh-primary px-6 py-3 text-sm font-medium tracking-[0.04em] text-white hover:bg-[#a33225]"
            >
              Request Fundraiser
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
