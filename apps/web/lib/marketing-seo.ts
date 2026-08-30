import type { Metadata } from "next";

/** Shared social preview for public marketing pages. */
export const MARKETING_OG_IMAGE = {
  url: "/marketing/hero-night.jpg",
  width: 1920,
  height: 1277,
  alt: "Athletic field under stadium lights — Heart & Hustle Fundraising",
} as const;

/** Default site description — used in root layout, JSON-LD, and fallbacks. */
export const MARKETING_SITE_DESCRIPTION =
  "100% return school and sports fundraising for high school athletics, activities, and booster clubs. FERPA and COPPA compliant—stated donations go back to your program. Personal donation links, no catalogs, no data selling. Illinois and youth nonprofits.";

export function marketingSocial(title: string, description: string, path: string) {
  return {
    openGraph: {
      title,
      description,
      url: path,
      type: "website" as const,
      images: [MARKETING_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [MARKETING_OG_IMAGE.url],
    },
  } satisfies Pick<Metadata, "openGraph" | "twitter">;
}
