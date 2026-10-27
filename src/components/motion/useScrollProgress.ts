"use client";

import { useEffect, useRef, type RefObject } from "react";

type Mode =
  /** 0 when the element's top enters the bottom of the viewport, 1 when its bottom leaves the top */
  | "through"
  /** for tall sections with a sticky child: 0 when the top reaches the viewport top, 1 when the bottom reaches the viewport bottom */
  | "sticky"
  /** 0 when the top enters the bottom of the viewport, 1 when the top reaches the viewport top */
  | "enter"
  /** for elements that start on screen (heroes): 0 at rest, 1 when the bottom leaves the top */
  | "leave";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Scroll-linked progress without scroll hijacking. Writes `--p` (0–1) on the element
 * and calls `onProgress`, only while the element is near the viewport.
 * Reduced motion: progress is pinned to 1 (the settled state).
 */
export function useScrollProgress<T extends HTMLElement>(
  mode: Mode = "through",
  onProgress?: (p: number) => void,
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const write = (p: number) => {
      el.style.setProperty("--p", p.toFixed(4));
      cb.current?.(p);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      write(1);
      return;
    }

    let raf = 0;
    let active = false;
    let last = -1;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let p: number;
      if (mode === "sticky") p = clamp01(-r.top / Math.max(1, r.height - vh));
      else if (mode === "enter") p = clamp01((vh - r.top) / vh);
      else if (mode === "leave") p = clamp01(-r.top / Math.max(1, r.height));
      else p = clamp01((vh - r.top) / (vh + r.height));
      if (Math.abs(p - last) > 0.0005) {
        last = p;
        write(p);
      }
    };

    const loop = () => {
      measure();
      if (active) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        const next = entry.isIntersecting;
        if (next && !active) {
          active = true;
          raf = requestAnimationFrame(loop);
        } else if (!next && active) {
          active = false;
          cancelAnimationFrame(raf);
          measure(); // settle at the edge value
        }
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    io.observe(el);
    measure();

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  return ref;
}
