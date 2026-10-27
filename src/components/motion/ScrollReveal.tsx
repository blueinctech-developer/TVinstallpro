"use client";

import { animate, stagger } from "animejs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Staggered scroll reveals for any element marked `data-reveal`.
 * Elements already on screen when the page loads are left alone (no flash);
 * everything below the fold rises in, staggered per batch, as it scrolls into view.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-state="done"])'),
    );
    const fold = window.innerHeight * 0.92;
    const pending = els.filter(
      (el) => el.dataset.revealState === "pending" || el.getBoundingClientRect().top > fold,
    );
    pending.forEach((el) => (el.dataset.revealState = "pending"));

    const io = new IntersectionObserver(
      (entries) => {
        const batch = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        if (!batch.length) return;
        batch.forEach((el) => io.unobserve(el));

        animate(batch, {
          opacity: { from: 0, to: 1, duration: 700, ease: "out(2)" },
          translateY: { from: 32, to: 0 },
          duration: 1100,
          ease: "outExpo",
          delay: stagger(80),
          // State stays "pending" (CSS opacity 0) until done; anime's inline styles win meanwhile.
          onComplete: () =>
            batch.forEach((el) => {
              el.dataset.revealState = "done";
              el.style.removeProperty("transform");
              el.style.removeProperty("opacity");
            }),
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );

    pending.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
