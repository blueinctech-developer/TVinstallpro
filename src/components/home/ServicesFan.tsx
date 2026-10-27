"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useScrollProgress } from "@/components/motion/useScrollProgress";
import { SectionHead } from "@/components/page/SectionHead";
import { services } from "@/lib/content";
import { money, tvFrom } from "@/lib/pricing";
import styles from "./ServicesFan.module.css";

const FAN = services; // all nine services

/**
 * A stack of service "screens" that fans out across the axis as the section scrolls
 * through (CSS reads --p; transforms per card are derived from its index --i).
 * Followed by a plain, keyboard-friendly index of every service.
 */
export function ServicesFan() {
  const ref = useScrollProgress<HTMLDivElement>("through");

  return (
    <section className={`section ${styles.services}`} aria-labelledby="services-title">
      <div className="wrap">
        <SectionHead
          id="services-title"
          title="Every wall. Every screen."
          lead="Nine installation services from one team. TV mounting has an instant estimate; everything else is quoted on request."
          action={
            <Link href="/services" className="link">
              Full services &amp; pricing <Icon name="arrow" size={16} />
            </Link>
          }
        />
      </div>

      <div ref={ref} className={styles.fanStage} aria-hidden="true">
        <span className="axis-line" />
        <div className={styles.fan}>
          {FAN.map((s, i) => (
            <div key={s.slug} className={styles.card} style={{ "--i": i - (FAN.length - 1) / 2 } as React.CSSProperties}>
              {/* eager: native lazy-loading doesn't see images inside 3D-transformed cards */}
              <Image src={s.image} alt="" fill sizes="(max-width: 760px) 40vw, 220px" loading="eager" />
              <span className={styles.cardTitle}>
                <span className={styles.cardNum}>{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="wrap">
        <ul className={`grid ${styles.index}`}>
          {services.map((s) => (
            <li key={s.slug} data-reveal="">
              <Link href={`/book?service=${s.slug}`} className={styles.item}>
                <span className={styles.itemIcon}>
                  <Icon name={s.icon} size={22} />
                </span>
                <span className={styles.itemText}>
                  <span className={styles.itemTitle}>{s.title}</span>
                  <span className={styles.itemShort}>{s.short}</span>
                </span>
                <span className={styles.itemPrice}>{s.estimator ? `From ${money(tvFrom)}` : "Quote"}</span>
                <Icon name="arrow" size={18} className={styles.itemArrow} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
