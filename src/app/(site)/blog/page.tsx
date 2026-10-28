import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page/PageHero";
import page from "@/components/page/page.module.css";
import { fmtDate } from "@/lib/admin/format";
import { publishedPosts } from "@/lib/public-content";
import styles from "./blog.module.css";

export const metadata: Metadata = {
  title: "Tips & news",
  description: "Advice on TV mounting, cable concealment and home installation from TV Install Pro.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const posts = await publishedPosts();
  // No published posts yet: the page doesn't exist (and isn't indexed) until there is one.
  if (!posts.length) notFound();
  return (
    <>
      <PageHero crumb="Tips & news" title="Tips" ghost="& news." lead="Advice on mounting, wiring and getting the most out of your setup." size="compact" />
      <section className={page.section}>
        <div className="wrap">
          <div className={styles.list}>
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className={styles.card}>
                {p.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_url} alt={p.cover_alt ?? ""} loading="lazy" />
                )}
                <span className={styles.meta}>{fmtDate(p.published_at)}</span>
                <h2>{p.title}</h2>
                {p.excerpt && <p className={styles.meta}>{p.excerpt}</p>}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
