import type { Metadata, Viewport } from "next";
import { Jura, Manrope } from "next/font/google";
import { siteIntroScript } from "@/components/intro/introState";
import { SiteIntro } from "@/components/intro/SiteIntro";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { site } from "@/lib/site";
import "./globals.css";

// Display: Jura (brand voice, headlines, figures). Text: Manrope (everything people read).
const jura = Jura({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-jura", display: "swap" });
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | TV Mounting & Installation in Ottawa & Gatineau`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: site.name,
    url: site.url,
    title: `${site.name} | TV Mounting & Installation in Ottawa & Gatineau`,
    description: site.description,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: site.name,
  url: site.url,
  telephone: "+1-418-334-7761",
  description: site.description,
  areaServed: ["Ottawa", "Gatineau"],
  priceRange: "$$",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-CA"
      className={`${jura.variable} ${manrope.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Adds the `js` class and decides, before first paint, whether the branded intro plays. */}
        <script dangerouslySetInnerHTML={{ __html: siteIntroScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteIntro />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <ScrollReveal />
      </body>
    </html>
  );
}
