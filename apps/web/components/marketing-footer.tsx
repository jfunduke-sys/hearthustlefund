import Link from "next/link";

export function MarketingFooter({
  includeSms = true,
}: {
  includeSms?: boolean;
}) {
  return (
    <footer className="border-t border-black/10 px-6 py-10 sm:px-10">
      <nav
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-neutral-700"
        aria-label="Footer"
      >
        <Link href="/how-it-works" className="underline underline-offset-2">
          How a school fundraiser works
        </Link>
        <span className="text-neutral-400" aria-hidden>
          ·
        </span>
        <Link href="/request-fundraiser" className="underline underline-offset-2">
          Request a school fundraiser
        </Link>
      </nav>
      <p className="mt-5 text-center text-sm text-neutral-600">
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy policy
        </Link>
        <span className="mx-2 text-neutral-400" aria-hidden>
          ·
        </span>
        <Link href="/terms" className="underline underline-offset-2">
          Terms of service
        </Link>
        {includeSms ? (
          <>
            <span className="mx-2 text-neutral-400" aria-hidden>
              ·
            </span>
            <Link href="/sms-reminders" className="underline underline-offset-2">
              SMS reminders
            </Link>
          </>
        ) : null}
      </p>
    </footer>
  );
}
