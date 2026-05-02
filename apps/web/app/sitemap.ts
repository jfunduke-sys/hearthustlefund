import type { MetadataRoute } from "next";
import { getSiteUrl, isSiteIndexable } from "@/lib/site-config";

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

/** Public marketing URLs only (no auth, no transactional thin pages). */
const STATIC_PATHS: {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/how-it-works", changeFrequency: "monthly", priority: 0.85 },
    { path: "/join", changeFrequency: "monthly", priority: 0.85 },
    { path: "/support", changeFrequency: "monthly", priority: 0.75 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.7 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.7 },
    { path: "/sms-reminders", changeFrequency: "yearly", priority: 0.65 },
    { path: "/request-fundraiser", changeFrequency: "monthly", priority: 0.8 },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSiteIndexable()) return [];

  const base = getSiteUrl();
  const lastModified = new Date();

  return STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
