import Link from "next/link";

export function MarketingFooter({
  includeSms = true,
}: {
  includeSms?: boolean;
}) {
  return (
    <footer className="border-t border-black/10 px-6 py-10 sm:px-10">
      <p className="text-center text-sm text-neutral-600">
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
