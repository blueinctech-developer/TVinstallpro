import { SiteIntro } from "@/components/intro/SiteIntro";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { site } from "@/lib/site";

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

// The public site's chrome: branded intro, header, footer and scroll motion.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteIntro />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <ScrollReveal />
    </>
  );
}
