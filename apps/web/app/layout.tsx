import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { SiteJsonLd } from "@/components/site-json-ld";
import { MARKETING_OG_IMAGE } from "@/lib/marketing-seo";
import { getRobotsMetadata, getSiteUrl } from "@/lib/site-config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const defaultDescription =
  "High school fundraising platform for athletics, activities, and booster clubs. FERPA and COPPA compliant school fundraisers with personal donation links. Also serving youth nonprofits in Illinois.";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();

  return {
    metadataBase: new URL(base.endsWith("/") ? base.slice(0, -1) : base),
    title: {
      default: `High School Fundraising Platform | ${BRAND.name}`,
      template: `%s | ${BRAND.name}`,
    },
    description: defaultDescription,
    icons: {
      icon: "/icon.svg",
    },
    robots: getRobotsMetadata(),
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: BRAND.name,
      title: `High School Fundraising Platform | ${BRAND.name}`,
      description: defaultDescription,
      url: base,
      images: [MARKETING_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `High School Fundraising Platform | ${BRAND.name}`,
      description: defaultDescription,
      images: [MARKETING_OG_IMAGE.url],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${newsreader.variable} min-h-screen font-sans antialiased`}
      >
        <SiteJsonLd />
        {children}
      </body>
    </html>
  );
}
