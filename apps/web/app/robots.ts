import type { MetadataRoute } from "next";
import { getSiteUrl, isSiteIndexable } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  if (!isSiteIndexable()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /** App and admin UIs; coach area uses `noindex` in `app/coach/layout.tsx` instead. */
      disallow: [
        "/admin",
        "/api/",
        "/coach",
        "/hh-enter",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
