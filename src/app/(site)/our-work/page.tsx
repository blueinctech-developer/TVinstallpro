import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page/PageHero";
import page from "@/components/page/page.module.css";
import { serviceTitle } from "@/lib/admin/format";
import { publishedPortfolio } from "@/lib/public-content";
import styles from "../blog/blog.module.css";

export const metadata: Metadata = {
  title: "Our work",
  description: "TV mounting and home installation projects by TV Install Pro in Ottawa and Gatineau.",
  alternates: { canonical: "/our-work" },
};

export default async function OurWork() {
  const projects = await publishedPortfolio();
  // Nothing published yet: no empty page for visitors or search engines.
  if (!projects.length) notFound();
  return (
    <>
      <PageHero crumb="Our work" title="Our" ghost="work." lead="Recent installations, photographed on the job." size="compact" />
      <section className={page.section}>
        <div className="wrap">
          <div className={styles.list}>
            {projects.map((p) => (
              <article key={p.id} id={p.slug} className={styles.card}>
                {p.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photos[0].url} alt={p.photos[0].alt || p.title} loading="lazy" />
                )}
                {p.service && <span className={styles.meta}>{serviceTitle(p.service)}</span>}
                <h2>{p.title}</h2>
                {p.description && <p className={styles.meta}>{p.description}</p>}
                {p.photos.length > 1 && (
                  <div className={styles.photos}>
                    {p.photos.slice(1).map((ph) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={ph.url} src={ph.url} alt={ph.alt || p.title} loading="lazy" />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
