"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/logo/Logo";
import { bookHref, nav, site } from "@/lib/site";
import styles from "./Header.module.css";

/**
 * Axial header: logo left · navigation centred on the axis · actions right.
 * One pill (the primary action); everything else is text. Over dark sections
 * (marked data-header="dark") the bar switches to dark glass with the light logo.
 */
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  // Scrolled state + what's under the bar (light or dark section).
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      setScrolled(window.scrollY > 12);
      const h = headerRef.current?.offsetHeight ?? 72;
      const under = document.elementFromPoint(window.innerWidth / 2, h + 1);
      setDark(!!under?.closest('[data-header="dark"]'));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  // Menu: lock scroll, Escape closes, focus loops through the menu AND its close button.
  useEffect(() => {
    if (!open) return;
    const panel = menuRef.current;
    const toggle = toggleRef.current;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab" || !panel || !toggle) return;
      const items = [toggle, ...Array.from(panel.querySelectorAll<HTMLElement>("a, button"))];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === items.length - 1 ? 0 : i + 1;
      e.preventDefault();
      items[next].focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const onDark = dark && !open;

  return (
    <>
      <header
        ref={headerRef}
        className={styles.header}
        data-scrolled={scrolled || undefined}
        data-tone={onDark ? "dark" : "light"}
        data-open={open || undefined}
      >
        <div className={`wrap ${styles.bar}`}>
          <Link href="/" className={styles.brand} aria-label={`${site.name}, home`}>
            <Logo animate deferToSiteIntro tone={onDark ? "inverse" : "default"} />
          </Link>

          <nav className={styles.nav} aria-label="Main">
            <ul>
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <a href={site.phoneHref} className={styles.phone}>
              <Icon name="phone" size={16} />
              <span>{site.phone}</span>
            </a>
            <Link href={bookHref} className={`btn ${styles.book}`}>
              Book a Service
            </Link>
            <button
              ref={toggleRef}
              type="button"
              className={styles.toggle}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className={styles.toggleLines} aria-hidden="true" data-open={open || undefined}>
                <span />
                <span />
              </span>
              <span className={styles.toggleText}>{open ? "Close" : "Menu"}</span>
            </button>
          </div>
        </div>
      </header>

      <div id="site-menu" ref={menuRef} className={styles.menu} data-open={open || undefined} hidden={!open}>
        <div className={`wrap ${styles.menuInner}`}>
          <nav aria-label="Menu">
            <ol className={styles.menuList}>
              {[{ href: "/", label: "Home" }, ...nav, { href: bookHref, label: "Book a Service" }].map((item, i) => (
                <li key={item.href} style={{ "--i": i } as React.CSSProperties}>
                  <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                    <span className={styles.menuNum} aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <aside className={styles.menuAside}>
            <p className={styles.menuArea}>{site.area}</p>
            <a href={site.phoneHref} className={styles.menuPhone}>
              {site.phone}
            </a>
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="link">
              Message us on WhatsApp <Icon name="arrow" size={16} />
            </a>
          </aside>
        </div>
      </div>

      {/* Phones: calling and booking are always one tap away (the booking page has its own controls). */}
      <div className={styles.mobileBar} hidden={pathname.startsWith("/book")}>
        <a href={site.phoneHref} className="btn btn--ghost">
          <Icon name="phone" size={16} /> Call
        </a>
        <Link href={bookHref} className="btn">
          Book a Service
        </Link>
      </div>
    </>
  );
}
