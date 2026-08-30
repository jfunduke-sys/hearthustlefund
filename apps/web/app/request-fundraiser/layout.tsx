import type { Metadata } from "next";
import type { ReactNode } from "react";
import { marketingSocial } from "@/lib/marketing-seo";

const requestTitle = "Request 100% Return School Fundraising";
const requestDescription =
  "Start a 100% return school or sports fundraiser for your high school team, activity, or booster club. One intake form to request a Heart & Hustle campaign in Illinois.";

export const metadata: Metadata = {
  title: requestTitle,
  description: requestDescription,
  alternates: { canonical: "/request-fundraiser" },
  ...marketingSocial(requestTitle, requestDescription, "/request-fundraiser"),
};

export default function RequestFundraiserLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
