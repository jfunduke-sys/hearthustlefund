import type { Metadata } from "next";
import JoinAppDownload from "./join-app-download";

export const metadata: Metadata = {
  title: "Athletes — use the app",
  description:
    "Heart & Hustle athlete team join happens in the mobile app with a 7-character code from your coach.",
  alternates: { canonical: "/join" },
};

export default function JoinInfoPage() {
  return <JoinAppDownload />;
}
