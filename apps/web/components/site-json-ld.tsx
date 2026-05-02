import { BRAND } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-config";

/** Organization + WebSite JSON-LD for the marketing site (single script). */
export function SiteJsonLd() {
  const url = getSiteUrl();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: "Heart and Hustle Fundraising LLC",
        url,
        logo: `${url}/icon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        name: BRAND.name,
        url,
        publisher: { "@id": `${url}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
