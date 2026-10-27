"use client";

import { useState } from "react";
import { useScrollProgress } from "@/components/motion/useScrollProgress";
import { LightTunnel } from "./LightTunnel";
import styles from "./Precision.module.css";

// Each word is tied to something the business actually does (see docs/audit.md).
const beats = [
  { word: "Precision", text: "Every mount placed, measured and secured with the right hardware for your wall." },
  { word: "Level", text: "Levelled and secured on drywall, metal studs, plaster, concrete, brick, tile or stone." },
  { word: "Concealed", text: "Wires fed through an existing channel in the wall, or neatly concealed outside it." },
  { word: "Tested", text: "A final check of every connection and input before we leave your home." },
];

/**
 * Cinematic transition from the light hero into a deep-blue environment.
 * A tall section with a sticky stage: the inset panel expands to full bleed, then
 * the words step through with scroll. Normal scrolling throughout; nothing is hijacked.
 */
export function Precision() {
  const [active, setActive] = useState(0);
  const ref = useScrollProgress<HTMLElement>("sticky", (p) => {
    // first 25% expands the panel; the rest steps through the words
    const t = Math.max(0, (p - 0.25) / 0.75);
    setActive(Math.min(beats.length - 1, Math.floor(t * beats.length)));
  });

  return (
    <section ref={ref} className={styles.precision} aria-labelledby="precision-title">
      <div className={styles.sticky}>
        <div className={`${styles.panel} on-dark`} data-header="dark">
          <LightTunnel className={styles.tunnel} />
          <span className={styles.beam} aria-hidden="true" />
          <span className={styles.horizon} aria-hidden="true" />

          <h2 id="precision-title" className="sr-only">
            How we install
          </h2>
          <ol className={styles.beats}>
            {beats.map((b, i) => (
              <li key={b.word} className={styles.beat} data-active={i === active || undefined}>
                <span className={`tracked ${styles.word}`}>{b.word}</span>
                <p className={styles.text}>{b.text}</p>
              </li>
            ))}
          </ol>

          <div className={styles.counter} aria-hidden="true">
            <span>{String(active + 1).padStart(2, "0")}</span>
            <span className={styles.track}>
              <span style={{ transform: `scaleX(${(active + 1) / beats.length})` }} />
            </span>
            <span>{String(beats.length).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
