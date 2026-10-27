import type { MetadataRoute } from "next";
import { bookHref, nav, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ href: "" }, ...nav, { href: bookHref }].map((item) => ({
    url: `${site.url}${item.href}`,
    changeFrequency: "monthly",
    priority: item.href ? 0.7 : 1,
  }));
}
