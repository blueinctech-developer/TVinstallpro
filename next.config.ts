import type { NextConfig } from "next";
import { services } from "./src/lib/content";

const nextConfig: NextConfig = {
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
      ...services.map((s) => ({ source: s.legacyPath, destination: `/book?service=${s.slug}`, permanent: true })),
    ];
  },
};

export default nextConfig;
