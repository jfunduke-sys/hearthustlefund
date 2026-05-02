import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { SiteJsonLd } from "@/components/site-json-ld";
import { getRobotsMetadata, getSiteUrl } from "@/lib/site-config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const defaultDescription =
  "Safe fundraising for youth and high school teams, clubs, and activities — 90% to your program (10% service fee; processing from Company’s share per Terms of service), no data selling, payouts after Stripe clearance per Terms, local support.";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();

  return {
    metadataBase: new URL(base.endsWith("/") ? base.slice(0, -1) : base),
    title: {
      default: BRAND.name,
      template: `%s | ${BRAND.name}`,
    },
    description: defaultDescription,
    icons: {
      icon: "/icon.svg",
    },
    robots: getRobotsMetadata(),
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: BRAND.name,
      title: BRAND.name,
      description: defaultDescription,
      url: base,
    },
    twitter: {
      card: "summary",
      title: BRAND.name,
      description: defaultDescription,
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
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <SiteJsonLd />
        {children}
      </body>
    </html>
  );
}
