import type { ReactNode } from "react";
import styles from "./SectionHead.module.css";

type SectionHeadProps = {
  id: string;
  title: ReactNode;
  /** one or two sentences that tell the reader why this section matters */
  lead?: ReactNode;
  /** optional link/button aligned with the lead */
  action?: ReactNode;
  /** false when the section choreographs its own heading entrance */
  reveal?: boolean;
  /** "dark" inside an .on-dark section */
  tone?: "light" | "dark";
};

/**
 * The one way a section opens: a hairline marks the new chapter, the heading sits left
 * of the central axis (columns 1–6), the supporting line and any action sit right of it
 * (columns 8–12), bottom-aligned. No labels above headings.
 */
export function SectionHead({ id, title, lead, action, reveal = true, tone = "light" }: SectionHeadProps) {
  const r = reveal ? { "data-reveal": "" } : {};
  return (
    <header className={`grid ${styles.head}`} data-tone={tone}>
      <h2 id={id} className={`display-2 ${styles.title}`} {...r}>
        {title}
      </h2>
      {(lead || action) && (
        <div className={styles.aside} data-head-aside="" {...r}>
          {lead && <p className={styles.lead}>{lead}</p>}
          {action}
        </div>
      )}
    </header>
  );
}
