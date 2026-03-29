import type { ReactNode } from "react";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function CoachSegmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
