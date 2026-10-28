import { SiteIntro } from "@/components/intro/SiteIntro";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { SiteDataProvider } from "@/components/SiteData";
import { TrackingCodes } from "@/components/TrackingCodes";
import { getSiteData, getTracking } from "@/lib/site-data";

// Business details, prices and tracking come from the admin. Pages are rebuilt at most every
// 5 minutes, and straight away when an admin saves (revalidatePath in the admin actions).
export const revalidate = 300;

// The public site's chrome: branded intro, header, footer and scroll motion.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [data, tracking] = await Promise.all([getSiteData(), getTracking()]);
  const b = data.business;
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: b.name,
    url: b.url,
    telephone: `+1-${b.phone.replace(/\D/g, "").slice(-10).replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`,
    description: b.description,
    areaServed: ["Ottawa", "Gatineau"],
    priceRange: "$$",
  };
  return (
    <SiteDataProvider value={data}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteIntro />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <ScrollReveal />
      <TrackingCodes t={tracking} />
    </SiteDataProvider>
  );
}
