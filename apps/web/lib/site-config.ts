/**
 * Public site origin for canonical URLs, sitemap, Open Graph, and JSON-LD.
 * Set `NEXT_PUBLIC_APP_URL` in each environment (e.g. Railway URL now, production domain at launch).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (raw) return raw;
  return "http://localhost:3000";
}

/**
 * When false, all pages inherit `noindex` and `/sitemap.xml` is empty so staging/pre-launch
 * hosts are less likely to pollute the index before the real domain goes live.
 */
export function isSiteIndexable(): boolean {
  const v = process.env.NEXT_PUBLIC_SITE_INDEXABLE?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "no") return false;
  return true;
}

export function getRobotsMetadata() {
  return isSiteIndexable()
    ? ({ index: true as const, follow: true as const })
    : ({ index: false as const, follow: false as const });
}
