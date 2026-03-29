import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { CAMPAIGN_SETUP_CODE, PLATFORM } from "@heart-and-hustle/shared";
import ParticipateForm from "./participate-form";
import { loadFundraiserJoinPreview } from "@/lib/fundraiser-join-lookup";

export default async function JoinParticipatePage({
  params,
}: {
  params: { slug: string };
}) {
  const fr = await loadFundraiserJoinPreview(params.slug);
  if (!fr) notFound();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(192,57,43,0.18),transparent),linear-gradient(180deg,#1a1a2e_0%,#f8fafc_50%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-md px-4 py-10">
        <Link
          href="/join"
          className="text-sm font-medium text-hh-primary hover:underline"
        >
          ← Find a team
        </Link>
        <p className="mt-4 rounded-xl border border-hh-primary/25 bg-hh-primary/5 p-3 text-xs leading-relaxed text-hh-dark">
          <strong>For athletes:</strong> use the {PLATFORM.shortName} mobile app
          with your coach&apos;s team code. This web form is only for internal
          testing.
        </p>
        <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-xs leading-relaxed text-amber-950">
          <strong>{CAMPAIGN_SETUP_CODE.label}:</strong>{" "}
          {CAMPAIGN_SETUP_CODE.joinFlowReminder}
        </p>
        <div className="mt-6">
          <ParticipateForm fundraiser={fr} />
        </div>
        <p className="mt-8 text-center text-xs text-slate-500">
          <Link href="/" className="hover:underline">
            {BRAND.name}
          </Link>
        </p>
      </div>
    </div>
  );
}
