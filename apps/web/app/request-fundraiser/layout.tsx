import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Request a fundraiser",
  description:
    "School and team leads: submit one intake form to start a Heart & Hustle Fundraising campaign.",
  alternates: { canonical: "/request-fundraiser" },
};

export default function RequestFundraiserLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
