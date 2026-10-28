import type { NextConfig } from "next";
import { services } from "./src/lib/content";

const nextConfig: NextConfig = {
  // PGlite (the local dev database) ships WebAssembly and data files that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    // All photography is local (/public/images), so no remote hosts are allowed.
    formats: ["image/avif", "image/webp"],
  },
  // Keep links and search rankings from the old WordPress site working.
  async redirects() {
    return [
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/book-a-service", destination: "/book", permanent: true },
      { source: "/pricing", destination: "/services", permanent: true },
      { source: "/services-1", destination: "/services", permanent: true },
      { source: "/service-tab1", destination: "/services", permanent: true },
      { source: "/other-inquiries", destination: "/contact", permanent: true },
      { source: "/contact-us-2", destination: "/contact", permanent: true },
      { source: "/pop-up-form", destination: "/contact", permanent: true },
      { source: "/cable-concealment", destination: "/book?service=tv-mounting", permanent: true },
      ...services.map((s) => ({ source: s.legacyPath, destination: `/book?service=${s.slug}`, permanent: true })),
    ];
  },
};

export default nextConfig;
