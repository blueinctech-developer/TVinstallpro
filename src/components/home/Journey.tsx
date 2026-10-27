"use client";

import { useScrollProgress } from "@/components/motion/useScrollProgress";
import { SectionHead } from "@/components/page/SectionHead";
import { process } from "@/lib/content";
import styles from "./Journey.module.css";

/** The four-step process laid out on the central axis; the axis fills as you scroll. */
export function Journey() {
  const ref = useScrollProgress<HTMLDivElement>("through");

  return (
    <section className={`section section--surface ${styles.journey}`} aria-labelledby="journey-title">
      <div className="wrap">
        <SectionHead
          id="journey-title"
          title="From booking to switched on."
          lead="Four steps from your request to a tested, working installation."
        />
        <div ref={ref} className={styles.track}>
          <span className={styles.axis} aria-hidden="true">
            <span className={styles.fill} />
          </span>
          <ol className={styles.steps}>
          {process.map((step, i) => (
            <li key={step.title} className={styles.step} data-side={i % 2 ? "right" : "left"} data-reveal="">
              <span className={styles.node} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className={styles.body}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
