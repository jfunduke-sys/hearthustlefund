import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-[5.75rem] max-w-5xl flex-nowrap items-stretch justify-between gap-4 px-3 sm:h-[6.5rem] sm:gap-6 sm:px-6">
          <Link
            href="/"
            className="flex min-h-0 shrink-0 items-center self-stretch py-0"
          >
            <BrandLogo
              priority
              className="h-full max-h-full min-h-0 w-auto object-contain object-left"
            />
          </Link>
          <nav className="flex min-h-0 min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3 md:gap-4">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-hh-primary bg-white text-base text-hh-primary hover:bg-hh-primary/10"
              asChild
            >
              <Link href="/request-fundraiser">Request fundraiser</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-base" asChild>
              <Link href="/coach/login">Coach login</Link>
            </Button>
            <Button variant="secondary" size="lg" className="text-base" asChild>
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <p className="text-sm font-medium uppercase tracking-wide text-hh-primary">
          High school sports fundraising
        </p>
        <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-hh-dark sm:text-5xl">
          Built for athletes. Powered by community.
        </h1>
        <ul className="mt-6 max-w-2xl space-y-3 text-base text-slate-700 sm:text-lg">
          <li className="flex gap-3">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hh-primary"
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-hh-dark">90%</strong> of
              donations go to your school program.
            </span>
          </li>
          <li className="flex gap-3">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hh-primary"
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-hh-dark">Zero data selling</strong>{" "}
              — donor and athlete information stays in your campaign.
            </span>
          </li>
          <li className="flex gap-3">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hh-primary"
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-hh-dark">
                Illinois-ready
              </strong>{" "}
              — paperwork and approval before any campaign goes live.
            </span>
          </li>
        </ul>
        <section className="mt-12 max-w-3xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-hh-dark sm:text-2xl">
            Why schools choose {BRAND.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Most fundraising platforms take a hidden cut, push products nobody
            asked for, or turn your participants and donors into a marketing list
            for sale. We don&apos;t. Heart &amp; Hustle was built on one rule: the
            program comes first.
          </p>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
            <li>
              <p className="font-semibold text-hh-dark">More for your athletes</p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                A high share of each donation is structured to flow back to your
                program—transparent processing, not layers of middlemen.
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
              <p className="font-semibold text-hh-dark">Built for teams, not catalogs</p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                Personal donation links and optional texting replace order forms,
                deliveries, and quota pressure—so coaches focus on athletes.
              </p>
            </li>
            <li>
              <p className="font-semibold text-hh-dark">Illinois-ready oversight</p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                Required paperwork and internal review happen before launch—so
                you&apos;re not improvising compliance on your own.
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
        </p>
      </main>
    </div>
  );
}
