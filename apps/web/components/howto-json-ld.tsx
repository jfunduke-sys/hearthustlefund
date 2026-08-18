import { BRAND } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-config";

type Step = {
  title: string;
  summary: string;
};

/** HowTo + FAQ structured data for the public How it works page. */
export function HowToJsonLd({ steps }: { steps: Step[] }) {
  const url = getSiteUrl();
  const pageUrl = `${url}/how-it-works`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: `How a ${BRAND.name} school fundraiser works`,
        description:
          "From the first school fundraiser request through campaign launch, donations, and payout to the program.",
        url: pageUrl,
        step: steps.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.title,
          text: step.summary,
          url: pageUrl,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do I start a school fundraiser with Heart & Hustle?",
            acceptedAnswer: {
              "@type": "Answer",
              text: steps[0]?.summary ?? "",
            },
          },
          {
            "@type": "Question",
            name: "How does a Heart & Hustle high school fundraiser work after the request?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Heart & Hustle reviews the request and Illinois paperwork, emails a campaign setup code, and the Organizer builds the campaign. Participants join in the app, share personal donation links, and the program receives payout after the campaign ends.",
            },
          },
          {
            "@type": "Question",
            name: "When does the school program get paid?",
            acceptedAnswer: {
              "@type": "Answer",
              text: steps[steps.length - 1]?.summary ?? "",
            },
          },
        ],
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
