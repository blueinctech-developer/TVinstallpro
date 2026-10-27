import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { IntroMotion } from "@/components/motion/IntroMotion";
import { SplitChars } from "@/components/motion/SplitChars";
import styles from "./PageHero.module.css";

type PageHeroProps = {
  crumb: string;
  /** first, emphasised part of the title */
  title: string;
  /** optional second part shown in ghost grey (changing emphasis) */
  ghost?: string;
  lead: string;
  /** "compact" for task pages (booking, contact, partner) so the form starts higher */
  size?: "default" | "compact";
  /** a photo turns the opening into a split: words left of the axis, the photo right of it */
  media?: { src: string; alt: string };
  /** "dark" opens the page on the abyss tone (the header follows) */
  tone?: "light" | "dark";
  /** a full-width band along the bottom of the opening, e.g. a price strip */
  strip?: ReactNode;
  children?: ReactNode;
};

/**
 * The inner-page opening. One structure (crumb, title, lead, actions) in three forms, so each
 * page starts differently without breaking the system: centred on the axis (default), split
 * around the axis with a photo (media), or dark with a strip of facts (tone + strip).
 */
export function PageHero({ crumb, title, ghost, lead, size = "default", media, tone = "light", strip, children }: PageHeroProps) {
  const cls = [styles.hero, size === "compact" && styles.compact, media && styles.split, tone === "dark" && `${styles.dark} on-dark`]
    .filter(Boolean)
    .join(" ");

  return (
    <IntroMotion className={cls} header={tone === "dark" ? "dark" : undefined}>
      {!media && <span className={`axis-line ${styles.axis}`} aria-hidden="true" />}
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.text}>
          <nav aria-label="Breadcrumb" data-intro-item>
            <ol className={styles.crumbs}>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-current="page">{crumb}</li>
            </ol>
          </nav>
          <h1 className={`${size === "compact" ? "display-finale" : "display-1"} ${styles.title}`}>
            <SplitChars text={title} />
            {ghost && (
              <>
                {" "}
                <span className="ghost">
                  <SplitChars text={ghost} />
                </span>
              </>
            )}
          </h1>
          <p className={`lead ${styles.lead}`} data-intro-item>
            {lead}
          </p>
          {children && (
            <div className={styles.actions} data-intro-item>
              {children}
            </div>
          )}
        </div>
        {media && (
          <div className={styles.media}>
            <Image src={media.src} alt={media.alt} fill priority sizes="(max-width: 900px) 100vw, 50vw" />
            <span className={styles.wipe} data-intro-wipe="" aria-hidden="true" />
          </div>
        )}
      </div>
      {strip && (
        <div className={styles.strip} data-intro-item>
          <div className="wrap">{strip}</div>
        </div>
      )}
    </IntroMotion>
  );
}
