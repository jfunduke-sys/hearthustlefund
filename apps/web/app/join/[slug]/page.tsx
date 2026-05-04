import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { CAMPAIGN_SETUP_CODE, PLATFORM } from "@heart-and-hustle/shared";
import type { Fundraiser } from "@heart-and-hustle/shared";
import { loadActiveFundraiserByJoinSegment } from "@/lib/fundraiser-join-lookup";
import { ensureFundraiserJoinCode } from "@/lib/join-code";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSiteIndexable } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const fr = await loadActiveFundraiserByJoinSegment(params.slug);
  if (!fr) {
    return { title: "Team join" };
  }
  const title = `${fr.school_name} · ${fr.team_name}`;
  const description = `Team join code and instructions for ${fr.team_name} (${fr.school_name}) on ${BRAND.name}.`;
  const path = `/join/${encodeURIComponent(params.slug)}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: isSiteIndexable()
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: { title, description },
  };
}

export default async function JoinTeamLandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const fr = await loadActiveFundraiserByJoinSegment(params.slug);
  if (!fr) notFound();

  const admin = createAdminClient();
  const joinCode = await ensureFundraiserJoinCode(admin, fr.id, fr.join_code);
  const fundraiser = { ...fr, join_code: joinCode } as Fundraiser;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(192,57,43,0.2),transparent),linear-gradient(180deg,#1a1a2e_0%,#f8fafc_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-lg px-4 py-12">
        <Link
          href="/join"
          className="text-sm font-medium text-hh-primary hover:underline"
        >
          ← Team join
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-xl shadow-hh-dark/5 backdrop-blur-sm">
          <p className="text-center text-3xl" aria-hidden>
            🏆
          </p>
          <h1 className="mt-3 text-center text-2xl font-extrabold tracking-tight text-hh-dark md:text-3xl">
            {fundraiser.school_name}
          </h1>
          <p className="mt-1 text-center text-lg font-semibold text-hh-primary">
            {fundraiser.team_name}
          </p>

          <div className="mt-8 flex justify-center gap-4">
            {fundraiser.school_logo_url ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                <Image
                  src={fundraiser.school_logo_url}
                  alt=""
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            ) : null}
            {fundraiser.team_logo_url ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                <Image
                  src={fundraiser.team_logo_url}
                  alt=""
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            ) : null}
          </div>

          <p className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-left text-xs leading-relaxed text-amber-950">
            <strong>{CAMPAIGN_SETUP_CODE.label}:</strong>{" "}
            {CAMPAIGN_SETUP_CODE.joinFlowReminder}
          </p>

          <div className="mt-6 rounded-xl bg-gradient-to-br from-hh-dark to-slate-800 p-4 text-center text-white shadow-inner">
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">
              Team join code
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em]">
              {joinCode}
            </p>
            <p className="mt-2 text-xs text-white/75">
              Participants enter this in the {PLATFORM.shortName} app—not on the web.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="w-full bg-hh-primary text-base font-semibold hover:bg-hh-primary/90"
            >
              <Link href="/join">How to get the app</Link>
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-600">
            <strong>Organizers:</strong> In the app, use <strong>Sign in</strong> with
            your website email and password—<strong>not</strong> this team code
            (this code is only for participants).
          </p>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Deep link:{" "}
            <span className="font-mono">
              heartandhustle://join?code={joinCode}
            </span>
          </p>
          <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50/90 p-3 text-left text-xs text-slate-600">
            <summary className="cursor-pointer font-medium text-slate-700">
              Staff testing: web participant signup
            </summary>
            <p className="mt-2">
              Not for real campaign use.{" "}
              <Link
                href={`/join/${params.slug}/participate`}
                className="font-medium text-hh-primary underline"
              >
                Open web participant form
              </Link>
            </p>
          </details>
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
