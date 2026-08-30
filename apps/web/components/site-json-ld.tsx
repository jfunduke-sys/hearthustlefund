import { BRAND } from "@/lib/brand";
import { MARKETING_SITE_DESCRIPTION } from "@/lib/marketing-seo";
import { getSiteUrl } from "@/lib/site-config";

/** Organization + WebSite + SoftwareApplication JSON-LD for the marketing site. */
export function SiteJsonLd() {
  const url = getSiteUrl();
  const description = MARKETING_SITE_DESCRIPTION;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: "Heart and Hustle Fundraising LLC",
        legalName: "Heart and Hustle Fundraising LLC",
        alternateName: [BRAND.name, "Heart & Hustle"],
        url,
        logo: `${url}/icon.svg`,
        image: `${url}/marketing/hero-night.jpg`,
        description,
        email: "support@hearthustlefund.com",
        areaServed: {
          "@type": "State",
          name: "Illinois",
        },
        knowsAbout: [
          "100% return school fundraising",
          "100% return sports fundraising",
          "high school fundraising",
          "school fundraiser",
          "booster club fundraising",
          "high school athletics fundraising",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        name: BRAND.name,
        url,
        description,
        inLanguage: "en-US",
        publisher: { "@id": `${url}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${url}/#app`,
        name: BRAND.name,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Fundraising",
        operatingSystem: "Web, iOS, Android",
        url,
        description:
          "100% return school and sports fundraising platform. Stated donations go back to the program; FERPA and COPPA compliant.",
        offers: {
          "@type": "Offer",
          url: `${url}/request-fundraiser`,
          availability: "https://schema.org/OnlineOnly",
          description:
            "100% return school and sports fundraising for Illinois high school programs.",
          areaServed: {
            "@type": "State",
            name: "Illinois",
          },
        },
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
