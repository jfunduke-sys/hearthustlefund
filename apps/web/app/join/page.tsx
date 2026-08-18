import type { Metadata } from "next";
import JoinAppDownload from "./join-app-download";

export const metadata: Metadata = {
  title: "Join a school fundraiser in the app",
  description:
    "Join a Heart & Hustle school fundraiser in the mobile app with a 7-character team code from your Organizer (coach, sponsor, or fundraising lead).",
  alternates: { canonical: "/join" },
};

export default function JoinInfoPage() {
  return <JoinAppDownload />;
}
