"use client";

import Image from "next/image";
import { useScrollProgress } from "@/components/motion/useScrollProgress";
import { SectionHead } from "@/components/page/SectionHead";
import { work } from "@/lib/content";
import styles from "./Work.module.css";

/**
 * The page's mid-point change of tone: a dark band of real job photos. Each photo drifts
 * slightly against its frame as the band scrolls through (CSS reads --p).
 */
export function Work() {
  const ref = useScrollProgress<HTMLDivElement>("through");

  return (
    <section className={`section on-dark ${styles.work}`} data-header="dark" aria-labelledby="work-title">
      <div className="wrap">
        <SectionHead
          id="work-title"
          tone="dark"
          title={
            <>
              Real walls. <span className="ghost">Real installs.</span>
            </>
          }
          lead="Photos from TV Install Pro jobs: the mounts, walls and finishes behind the work."
        />
        <div ref={ref} className={styles.mosaic}>
          {work.map((w, i) => (
            <figure key={w.src} className={styles.item} data-k={i} data-reveal="">
              <div className={styles.media}>
                {/* the caption describes the photo */}
                <Image
                  src={w.src}
                  alt=""
                  fill
                  style={"focus" in w ? { objectPosition: w.focus } : undefined}
                  sizes={i === 0 ? "(max-width: 900px) 100vw, 50vw" : "(max-width: 900px) 50vw, 34vw"}
                />
              </div>
              <figcaption className={styles.caption}>{w.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
