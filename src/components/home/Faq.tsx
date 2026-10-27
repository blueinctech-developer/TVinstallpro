import { SectionHead } from "@/components/page/SectionHead";
import { faqs } from "@/lib/content";
import { site } from "@/lib/site";
import styles from "./Faq.module.css";

/** Native <details> accordion: keyboard and screen-reader friendly with no JS; CSS animates the open. */
export function Faq({ items = faqs, title = "Questions, answered." }: { items?: typeof faqs; title?: string }) {
  return (
    <section className="section" aria-labelledby="faq-title">
      <div className="wrap">
        <SectionHead
          id="faq-title"
          title={title}
          lead={
            <>
              Can&apos;t find yours? Call us on{" "}
              <a href={site.phoneHref} className="link">
                {site.phone}
              </a>
              .
            </>
          }
        />
        <div className={styles.list}>
          {items.map((f) => (
            <details key={f.q} className={styles.item} data-reveal="">
              <summary>
                <span>{f.q}</span>
                <span className={styles.toggle} aria-hidden="true" />
              </summary>
              <div className={styles.answer}>
                <p>{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
