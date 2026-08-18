import { BRAND } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-config";

/** Organization + WebSite + SoftwareApplication JSON-LD for the marketing site. */
export function SiteJsonLd() {
  const url = getSiteUrl();
  const description =
    "Fundraising platform for high school athletics, activities, and booster clubs. FERPA and COPPA compliant school fundraisers with personal donation links. Also serving youth nonprofits and community programs in Illinois.";

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
        description,
        offers: {
          "@type": "Offer",
          url: `${url}/request-fundraiser`,
          availability: "https://schema.org/OnlineOnly",
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
