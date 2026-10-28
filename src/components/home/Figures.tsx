"use client";

import { createTimeline, stagger, utils } from "animejs";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Odometer } from "@/components/motion/Odometer";
import { SplitChars } from "@/components/motion/SplitChars";
import { SectionHead } from "@/components/page/SectionHead";
import { useSiteData } from "@/components/SiteData";
import { tvFromOf } from "@/lib/pricing";
import type { SiteData } from "@/lib/site-defaults";
import styles from "./Figures.module.css";

// Only figures published by the business (see docs/audit.md). No invented statistics.
const rowsFor = ({ business: site, services, prices }: SiteData) => [
  { value: `${tvFromOf(prices).toFixed(2)}`, label: "TV mounting starts at", status: "Instant estimate" },
  { value: String(site.warrantyMonths), label: "Month warranty on installation work", status: "Warranty included" },
  { value: String(site.componentsIncluded), label: "Existing components connected in a standard install", status: "Included" },
  { value: String(services.length), label: "Installation services, one team", status: "Same-day often available" },
];

/**
 * Choreography (anime.js), all scroll-triggered, never looping:
 *  heading  — letters rise out of their masks, then the supporting line fades up
 *  each row — as it arrives: the hairline draws left→right, the number rises and its
 *             digits roll, the label follows, the status badge sweeps in and its check pops
 * Without JS / with reduced motion everything is simply shown in its final state.
 */
export function Figures() {
  const rows = rowsFor(useSiteData());
  const ref = useRef<HTMLElement>(null);
  const [played, setPlayed] = useState<boolean[]>(() => rows.map(() => false));

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlayed(rows.map(() => true));
      return;
    }

    const head = root.querySelector<HTMLElement>("header");
    const chars = root.querySelectorAll<HTMLElement>("h2 [data-char]");
    const aside = root.querySelector<HTMLElement>("[data-head-aside]");
    const rowEls = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
    const timelines: ReturnType<typeof createTimeline>[] = [];

    // Arm: pin start states inline (CSS keeps badges empty only while a row is armed).
    utils.set(chars, { translateY: "110%" });
    if (aside) utils.set(aside, { opacity: 0, translateY: 16 });
    rowEls.forEach((r) => {
      r.dataset.armed = "";
      utils.set(r.querySelector<HTMLElement>("[data-rule]")!, { scaleX: 0 });
      utils.set(r.querySelectorAll<HTMLElement>("[data-rise]"), { opacity: 0, translateY: 28 });
    });

    const playHead = () => {
      const tl = createTimeline({ defaults: { ease: "outExpo" } });
      tl.add(chars, { translateY: ["110%", "0%"], duration: 1100, delay: stagger(22) }, 0);
      if (aside) tl.add(aside, { opacity: [0, 1], translateY: [16, 0], duration: 900 }, 380);
      timelines.push(tl);
    };

    const playRow = (r: HTMLElement) => {
      const i = rowEls.indexOf(r);
      const tl = createTimeline({ defaults: { ease: "outExpo" } });
      tl.add(r.querySelector<HTMLElement>("[data-rule]")!, { scaleX: [0, 1], duration: 1000, ease: "inOutQuart" }, 0)
        .add(r.querySelectorAll<HTMLElement>("[data-rise]"), {
          opacity: [0, 1],
          translateY: [28, 0],
          duration: 900,
          delay: stagger(110),
        }, 160)
        .call(() => {
          // Badge fill + check are CSS transitions keyed off data-on; the digits roll on cue.
          r.dataset.on = "";
          setPlayed((p) => p.map((v, k) => (k === i ? true : v)));
        }, 260);
      timelines.push(tl);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          if (e.target === head) playHead();
          else playRow(e.target as HTMLElement);
        }
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.2 },
    );
    if (head) io.observe(head);
    rowEls.forEach((r) => io.observe(r));

    return () => {
      io.disconnect();
      timelines.forEach((t) => t.revert());
      rowEls.forEach((r) => {
        delete r.dataset.armed;
        delete r.dataset.on;
      });
    };
  }, []);

  return (
    <section ref={ref} className={`section ${styles.figures}`} aria-labelledby="figures-title">
      <div className="wrap">
        <SectionHead
          id="figures-title"
          reveal={false}
          title={<SplitChars text="Know the price before we arrive." />}
          lead="TV-mounting prices are itemised up front, and your technician confirms the final price before any work starts."
        />
        <dl className={styles.list}>
          {rows.map((r, i) => (
            <div key={r.label} className={`grid ${styles.row}`} data-row="">
              <span className={styles.rule} data-rule="" aria-hidden="true" />
              <dt className={styles.label} data-rise="">
                {r.label}
              </dt>
              <dd className={styles.value} data-rise="">
                <Odometer value={r.value} play={played[i]} />
              </dd>
              {/* A status badge, not a control: it fills when the row arrives and has no knob to "flip". */}
              <dd className={styles.statusCell}>
                <span className={styles.status}>
                  <span className={styles.statusText}>{r.status}</span>
                  <span className={styles.check} aria-hidden="true">
                    <Icon name="check" size={18} strokeWidth={2.2} />
                  </span>
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
