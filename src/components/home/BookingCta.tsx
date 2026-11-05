import Link from "next/link";
import { Icon } from "@/components/Icon";
import { getSiteData } from "@/lib/site-data";
import { bookHref } from "@/lib/site";
import styles from "./BookingCta.module.css";

export async function BookingCta() {
  const { business: site } = await getSiteData();
  return (
    <section className={`${styles.cta} on-dark`} data-header="dark" aria-labelledby="cta-title">
      <span className={styles.beam} aria-hidden="true" />
      <div className={`wrap ${styles.inner}`}>
        <h2 id="cta-title" className={`display-finale ${styles.title}`} data-reveal="">
          Ready when <span className={styles.ghost}>your wall is.</span>
        </h2>
        <p className={styles.lead} data-reveal="">
          Book in about two minutes. You&apos;ll see your estimate before you send, and we&apos;ll confirm a time that
          suits you.
        </p>
        <div className={styles.actions} data-reveal="">
          <Link href={bookHref} className="btn btn--light">
            Book your installation
            <span className="btn-dot" aria-hidden="true">
              <Icon name="arrow" size={14} strokeWidth={2} />
            </span>
          </Link>
          <a href={site.phoneHref} className="btn btn--on-dark">
            <Icon name="phone" size={16} />
            {site.phone}
          </a>
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn--on-dark">
            <Icon name="whatsapp" size={16} />
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
