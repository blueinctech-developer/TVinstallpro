import type { MetadataRoute } from "next";
import { publishedPosts } from "@/lib/public-content";
import { getSiteData } from "@/lib/site-data";
import { bookHref, navWith, site } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { links } = await getSiteData();
  const posts = links.blog ? await publishedPosts() : [];
  return [{ href: "" }, ...navWith(links), { href: bookHref }, ...posts.map((p) => ({ href: `/blog/${p.slug}` }))].map((item) => ({
    url: `${site.url}${item.href}`,
    changeFrequency: "monthly",
    priority: item.href ? 0.7 : 1,
  }));
}
