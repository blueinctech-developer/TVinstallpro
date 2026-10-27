import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookingCta } from "@/components/home/BookingCta";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/page/PageHero";
import { SectionHead } from "@/components/page/SectionHead";
import page from "@/components/page/page.module.css";
import { otherServices, services } from "@/lib/content";
import {
  addOns,
  concealment,
  deviceSetupPrice,
  devicesBehindPrice,
  fireplaceSurcharge,
  maintenance,
  money,
  mounts,
  surfaces,
  takedownPrice,
  tvFrom,
  tvSizes,
  type Choice,
} from "@/lib/pricing";
import styles from "./services.module.css";

export const metadata: Metadata = {
  title: "Services & Pricing",
  description:
    "TV mounting prices by TV size, mount, wall type and extras, plus mantel mounts, laser TVs, Samsung Frame, appliances, blinds, garage shelving, gazebos and wallpaper.",
  alternates: { canonical: "/services" },
};

const tables: { title: string; rows: Choice[]; prefix?: string }[] = [
  { title: "TV size", rows: tvSizes },
  { title: "Wall mount", rows: mounts },
  { title: "Wall surface", rows: surfaces, prefix: "+" },
  { title: "Cable concealment", rows: concealment },
  { title: "Add-ons", rows: addOns, prefix: "+" },
  { title: "Extended maintenance", rows: maintenance, prefix: "+" },
];

export default function ServicesPage() {
  const tv = services[0];
  const rest = services.slice(1);

  return (
    <>
      <PageHero
        crumb="Services & Pricing"
        title="Services"
        ghost="& pricing."
        lead="Itemised TV-mounting prices you can check before we arrive, and eight more installation services quoted on request."
        tone="dark"
        strip={
          <dl className={styles.strip}>
            <div className={styles.stripHead}>
              <dt>TV mounting</dt>
              <dd>by TV size</dd>
            </div>
            {tvSizes.map((s) => (
              <div key={s.id} className={styles.stripCell}>
                <dt>{s.label}</dt>
                <dd>{money(s.price)}</dd>
              </div>
            ))}
          </dl>
        }
      >
        <Link href="/book?service=tv-mounting" className="btn">
          Get an instant estimate
          <span className="btn-dot" aria-hidden="true">
            <Icon name="arrow" size={14} strokeWidth={2} />
          </span>
        </Link>
      </PageHero>

      {/* ---------- TV mounting: full price list ---------- */}
      <section id={tv.slug} className={`${page.section} ${styles.tv}`} aria-labelledby="tv-title">
        <div className="wrap grid">
          <div className={styles.tvIntro}>
            <h2 id="tv-title" className="display-2" data-reveal="">
              {tv.title}
            </h2>
            <p className={styles.from} data-reveal="">
              <span>From</span>
              <strong>{money(tvFrom)}</strong>
            </p>
            <p className={styles.tvBody} data-reveal="">
              {tv.body} Your estimate is the TV size plus the options you choose.
            </p>
            <ul className={styles.facts} data-reveal="">
              <li>
                Above a fireplace: <strong>+{money(fireplaceSurcharge)}</strong>
              </li>
              <li>
                Existing TV takedown: <strong>+{money(takedownPrice)}</strong>
              </li>
              <li>
                Device setup: <strong>{money(deviceSetupPrice)}</strong> per device
              </li>
              <li>
                Devices behind the TV: <strong>{money(devicesBehindPrice)}</strong> per device
              </li>
            </ul>
            <Link href="/book?service=tv-mounting" className="btn" data-reveal="">
              Get an instant estimate
              <span className="btn-dot" aria-hidden="true">
                <Icon name="arrow" size={14} strokeWidth={2} />
              </span>
            </Link>
          </div>

          <div className={styles.tables}>
            {tables.map((t) => (
              <div key={t.title} className={styles.table} data-reveal="">
                <h3>{t.title}</h3>
                <dl>
                  {t.rows.map((r) => (
                    <div key={r.id}>
                      <dt>{r.label}</dt>
                      <dd>
                        {r.price ? `${t.prefix ?? ""}${money(r.price)}${r.note ? ` ${r.note}` : ""}` : r.note ? r.note : "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            <p className={styles.tableNote}>Prices in CAD. Estimates are confirmed by your technician before work begins.</p>
          </div>
        </div>
      </section>

      {/* ---------- Every other service ---------- */}
      <section className={`${page.section} ${page.surface}`} aria-labelledby="more-title">
        <div className="wrap">
          <SectionHead
            id="more-title"
            title="Beyond the TV."
            lead="Eight more installation services, each quoted on request. Tell us about the job and we'll come back with a price."
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
                  <p className={styles.quote}>Quoted on request</p>
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
