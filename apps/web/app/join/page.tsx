import type { Metadata } from "next";
import JoinAppDownload from "./join-app-download";

export const metadata: Metadata = {
  title: "Participants — use the app",
  description:
    "Heart & Hustle team join for participants happens in the mobile app with a 7-character team code from your Organizer (coach, sponsor, or fundraising lead).",
  alternates: { canonical: "/join" },
};

export default function JoinInfoPage() {
  return <JoinAppDownload />;
}
