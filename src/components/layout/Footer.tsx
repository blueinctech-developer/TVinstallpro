"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/logo/Logo";
import { useScrollProgress } from "@/components/motion/useScrollProgress";
import { services } from "@/lib/content";
import { bookHref, nav, site } from "@/lib/site";
import styles from "./Footer.module.css";

export function Footer() {
  // The wordmark slides sideways only as the visitor scrolls (never auto-plays).
  const ref = useScrollProgress<HTMLElement>("enter");

  return (
    <footer ref={ref} className={`${styles.footer} on-dark`} data-header="dark">
      <div className={styles.wordmark} aria-hidden="true">
        <span>TV Install Pro</span>
        <span className={styles.wordGhost}>Mounted with precision</span>
        <span>TV Install Pro</span>
      </div>

      <div className={`wrap grid ${styles.grid}`}>
        <div className={styles.lead}>
          <Link href="/" className={styles.logo} aria-label={`${site.name}, home`}>
            <Logo tone="inverse" />
          </Link>
          <p>
            Professional TV mounting and home installation in {site.area}. Same-day installation is often available.
          </p>
          <Link href={bookHref} className="btn btn--light">
            Book a Service
            <span className="btn-dot" aria-hidden="true">
              <Icon name="arrow" size={14} strokeWidth={2} />
            </span>
          </Link>
        </div>

        <nav className={styles.col} aria-labelledby="f-site">
          <h2 id="f-site">Site</h2>
          <ul>
            {[{ href: "/", label: "Home" }, ...nav, { href: bookHref, label: "Book a Service" }].map((n) => (
              <li key={n.href}>
                <Link href={n.href}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={styles.col} aria-labelledby="f-services">
          <h2 id="f-services">Services</h2>
          <ul>
            {services.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link href={`/services#${s.slug}`}>{s.title}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.col}>
          <h2>Contact</h2>
          <ul>
            <li>
              <a href={site.phoneHref}>{site.phone}</a>
            </li>
            <li>
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
            <li>{site.area}</li>
          </ul>
        </div>
      </div>

      <div className={`wrap ${styles.base}`}>
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <p>Estimates are confirmed by your technician before work begins.</p>
      </div>
    </footer>
  );
}
