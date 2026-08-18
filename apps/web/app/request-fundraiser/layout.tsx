import type { Metadata } from "next";
import type { ReactNode } from "react";
import { marketingSocial } from "@/lib/marketing-seo";

const requestTitle = "Request a High School Fundraiser";
const requestDescription =
  "Start a school fundraiser for your high school team, activity, or booster club. Submit one intake form to request a Heart & Hustle campaign in Illinois.";

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
