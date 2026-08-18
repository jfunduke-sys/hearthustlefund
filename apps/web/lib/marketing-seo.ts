import type { Metadata } from "next";

/** Shared social preview for public marketing pages. */
export const MARKETING_OG_IMAGE = {
  url: "/marketing/hero-night.jpg",
  width: 1920,
  height: 1277,
  alt: "Athletic field under stadium lights — Heart & Hustle Fundraising",
} as const;

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
