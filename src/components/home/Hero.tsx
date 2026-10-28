"use client";

import Link from "next/link";
import { useRef } from "react";
import { TvVisual } from "@/components/hero/TvVisual";
import { Icon } from "@/components/Icon";
import { IntroMotion } from "@/components/motion/IntroMotion";
import { SplitChars } from "@/components/motion/SplitChars";
import { useScrollProgress } from "@/components/motion/useScrollProgress";
import { useSiteData } from "@/components/SiteData";
import { money, tvFromOf } from "@/lib/pricing";
import { bookHref } from "@/lib/site";
import styles from "./Hero.module.css";

export function Hero() {
  const { business: site, prices } = useSiteData();
  const tvFrom = tvFromOf(prices);
  const progress = useRef(0);
  // Scroll progress drives the headline drift (CSS --p) and the TV's pose (ref).
  const ref = useScrollProgress<HTMLDivElement>("leave", (p) => {
    progress.current = p;
  });

  return (
    <IntroMotion className={styles.hero}>
      <div ref={ref} className={styles.frame}>
        <span className={`axis-line ${styles.axis}`} aria-hidden="true" />
        <span className={styles.orb} aria-hidden="true" />

        <h1 className={styles.title}>
          <span className={styles.line1}>
            <SplitChars text="Your TV," />
          </span>
          <span className={styles.line2}>
            <SplitChars text="mounted" />{" "}
            <span className="ghost">
              <SplitChars text="to perfection." />
            </span>
          </span>
          {/* Says what and where, in the heading itself (search + first-glance clarity). */}
          <span className={styles.where} data-intro-item>
            TV mounting &amp; installation in Ottawa &amp; Gatineau
          </span>
        </h1>

        <div className={styles.stage}>
          <TvVisual progress={progress} />
        </div>

        <div className={`wrap grid ${styles.foot}`}>
          <p className={styles.pitch} data-intro-item>
            Itemised prices before we arrive and a {site.warrantyMonths}-month warranty on installation work. Same-day
            installation is often available.
          </p>

          <p className={styles.price} data-intro-item>
            <span className={styles.priceLabel}>TV mounting from</span>
            <span className={styles.priceValue}>{money(tvFrom)}</span>
          </p>

          <div className={styles.ctas} data-intro-item>
            <Link href={bookHref} className="btn">
              Get an instant estimate
              <span className="btn-dot" aria-hidden="true">
                <Icon name="arrow" size={14} strokeWidth={2} />
              </span>
            </Link>
            <a href={site.phoneHref} className="btn btn--ghost">
              <Icon name="phone" size={16} />
              {site.phone}
            </a>
          </div>
        </div>
      </div>
    </IntroMotion>
  );
}
