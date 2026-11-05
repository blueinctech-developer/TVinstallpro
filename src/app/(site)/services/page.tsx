import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookingCta } from "@/components/home/BookingCta";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/page/PageHero";
import { SectionHead } from "@/components/page/SectionHead";
import page from "@/components/page/page.module.css";
import { otherServices, services as defaultServices } from "@/lib/content";
import type { Choice } from "@/lib/pricing";
import { getSiteData } from "@/lib/site-data";
import { countWord } from "@/lib/site-defaults";
import styles from "./services.module.css";

export const metadata: Metadata = {
  title: "Services",
  description:
    "TV mounting on any wall, with fixed, tilting or full-motion mounts and hidden cables, plus mantel mounts, laser TVs, Samsung Frame, appliances, blinds, garage shelving, gazebos and wallpaper.",
  alternates: { canonical: "/services" },
};

/** Option names only; prices appear once, in the booking estimate. Placeholder options ("Help me choose", "Other") are left out. */
const named = (list: Choice[], skip: string[] = []) => list.filter((c) => !skip.includes(c.id)).map((c) => c.label);

export default async function ServicesPage() {
  const { services, prices } = await getSiteData();
  const { tvSizes, mounts, surfaces, concealment, addOns } = prices;
  const groups: { title: string; items: string[] }[] = [
    { title: "TV sizes", items: named(tvSizes) },
    { title: "Wall mounts", items: [...named(mounts, ["own", "help"]), "Or the mount you already have"] },
    { title: "Wall surfaces", items: named(surfaces, ["unknown"]) },
    { title: "Hidden cables", items: named(concealment, ["none", "help"]) },
    { title: "Add-ons", items: named(addOns, ["other"]) },
  ];
  const tv = services.find((s) => s.estimator) ?? defaultServices[0];
  const rest = services.filter((s) => s !== tv);

  return (
    <>
      <PageHero
        crumb="Services"
        title="Our"
        ghost="services."
        lead={`TV mounting on any wall, and ${countWord(rest.length).toLowerCase()} more installation services from the same team.`}
        tone="dark"
      >
        <Link href="/book?service=tv-mounting" className="btn">
          Book TV mounting
          <span className="btn-dot" aria-hidden="true">
            <Icon name="arrow" size={14} strokeWidth={2} />
          </span>
        </Link>
      </PageHero>

      {/* ---------- TV mounting: everything we can do ---------- */}
      <section id={tv.slug} className={`${page.section} ${styles.tv}`} aria-labelledby="tv-title">
        <div className="wrap grid">
          <div className={styles.tvIntro}>
            <h2 id="tv-title" className="display-2" data-reveal="">
              {tv.title}
            </h2>
            <p className={styles.tvBody} data-reveal="">
              {tv.body} Answer a few quick questions and you&apos;ll see your estimate before you send anything.
            </p>
            <ul className={styles.facts} data-reveal="">
              <li>Above-fireplace installs</li>
              <li>Taking down your old TV</li>
              <li>Setting up your devices, or hiding them behind the TV</li>
              <li>A second technician for 90″ – 100″ TVs</li>
            </ul>
            <Link href="/book?service=tv-mounting" className="btn" data-reveal="">
              Book TV mounting
              <span className="btn-dot" aria-hidden="true">
                <Icon name="arrow" size={14} strokeWidth={2} />
              </span>
            </Link>
          </div>

          <div className={styles.tables}>
            {groups.map((g) => (
              <div key={g.title} className={styles.table} data-reveal="">
                <h3>{g.title}</h3>
                <ul>
                  {g.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <p className={styles.tableNote}>Your technician confirms the final price before work begins.</p>
          </div>
        </div>
      </section>

      {/* ---------- Every other service ---------- */}
      <section className={`${page.section} ${page.surface}`} aria-labelledby="more-title">
        <div className="wrap">
          <SectionHead
            id="more-title"
            title="Beyond the TV."
            lead={`${countWord(rest.length)} more installation services. Tell us about the job and we'll come back with a quote.`}
          />
          <div className={styles.rows}>
            {rest.map((s, i) => (
              <article key={s.slug} id={s.slug} className={`grid ${page.split} ${styles.row}`} data-flip={i % 2 ? "" : undefined}>
                <div className={page.splitMedia} data-reveal="">
                  <Image src={s.image} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
                </div>
                <div className={page.splitCopy} data-reveal="">
                  <span className={styles.icon}>
                    <Icon name={s.icon} size={22} />
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  <Link href={`/book?service=${s.slug}`} className="link">
                    Request a quote <Icon name="arrow" size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Also available ---------- */}
      <section className={page.section} aria-labelledby="also-title">
        <div className="wrap">
          <SectionHead
            id="also-title"
            title="Also available."
            lead="Handyman and installation work beyond our main services."
            action={
              <Link href="/contact" className="link">
                Ask about another job <Icon name="arrow" size={16} />
              </Link>
            }
          />
          <ul className={styles.chips}>
            {otherServices.map((o) => (
              <li key={o} data-reveal="">
                {o}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <BookingCta />
    </>
  );
}
