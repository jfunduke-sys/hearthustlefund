import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import JoinAppDownload from "./join-app-download";

export const metadata: Metadata = {
  title: `Athletes — use the app | ${BRAND.name}`,
  description:
    "Heart & Hustle athlete team join happens in the mobile app with a 7-character code from your coach.",
};

export default function JoinInfoPage() {
  return <JoinAppDownload />;
}
