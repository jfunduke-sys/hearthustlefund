import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Bookmark this URL for SuperAdmin sign-in (not linked from public nav). */
export default function HhEnterPage() {
  redirect("/admin/login");
}
