import type { Metadata, Viewport } from "next";
import { Jura, Manrope } from "next/font/google";
import { siteIntroScript } from "@/components/intro/introState";
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

// Fonts, tokens and <html> only. The public site's chrome lives in (site)/layout.tsx and the
// admin's in admin/layout.tsx, so neither inherits the other's header, footer or motion.
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
      </head>
      <body>{children}</body>
    </html>
  );
}
