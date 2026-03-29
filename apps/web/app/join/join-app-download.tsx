import Link from "next/link";
import { BRAND } from "@/lib/brand";
import {
  NEW_PASSWORD_REQUIREMENT_COPY,
  PLATFORM,
  TEAM_JOIN,
  TEAM_JOIN_CODE_LENGTH,
} from "@heart-and-hustle/shared";

export default function JoinAppDownload() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(192,57,43,0.22),transparent),linear-gradient(165deg,#1a1a2e_0%,#252540_50%,#f8fafc_100%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-lg px-4 py-14 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-white/80 hover:text-white"
        >
          ← {BRAND.name}
        </Link>
        <p className="mt-10 text-4xl drop-shadow-sm" aria-hidden>
          📱
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Athletes join in the app
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/85">
          Team fundraising for athletes happens in the {PLATFORM.shortName}{" "}
          mobile app. Download it, tap <strong>Team code</strong>, enter your
          coach&apos;s <strong>{TEAM_JOIN_CODE_LENGTH}-character</strong> code,
          then create your email and password to reach your dashboard.{" "}
          {NEW_PASSWORD_REQUIREMENT_COPY}
        </p>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/95 p-6 text-left shadow-xl backdrop-blur-sm">
          <p className="text-sm font-semibold text-hh-dark">Get the app</p>
          <p className="mt-2 text-sm text-slate-600">
            Search for <strong>{PLATFORM.displayName}</strong> or{" "}
            <strong>{PLATFORM.shortName}</strong> in the App Store or Google
            Play. Your coach will text or hand you the team code—different from
            the HH setup code they use on the website.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            {TEAM_JOIN.slugHelp}
          </p>
        </div>

        <p className="mx-auto mt-10 max-w-md text-xs text-white/70">
          <strong className="text-white">Coaches:</strong> create campaigns and
          view dashboards on the website. Use the same app login to text
          contacts and join as a participant on your phone.
        </p>
      </div>
    </div>
  );
}
