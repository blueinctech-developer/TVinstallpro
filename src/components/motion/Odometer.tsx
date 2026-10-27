"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";

/**
 * Rolling-digit number (odometer). Each digit is a vertical strip 0–9 that rolls to its
 * value. Non-digits ($ . ,) stay put. Screen readers get the plain value; the final value
 * is server-rendered.
 *
 * Trigger: by default it rolls the first time it scrolls into view. Pass `play` to cue it
 * from a parent's choreography instead (rolls when `play` becomes true).
 */
export function Odometer({ value, className, play }: { value: string; className?: string; play?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const rolled = useRef(false);
  const cued = play !== undefined;

  // Reset to zero on mount (hidden below the fold anyway).
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rolled.current = true;
      return;
    }
    el.querySelectorAll<HTMLElement>("[data-strip]").forEach((s) => (s.style.transform = "translateY(0%)"));
    rolled.current = false;
  }, [value]);

  const roll = () => {
    const el = ref.current;
    if (!el || rolled.current) return;
    rolled.current = true;
    el.querySelectorAll<HTMLElement>("[data-strip]").forEach((s, i) =>
      animate(s, {
        translateY: `${-Number(s.dataset.strip) * 10}%`,
        duration: 1600,
        ease: "outExpo",
        delay: i * 90,
      }),
    );
  };

  // Self-triggered: first time in view.
  useEffect(() => {
    const el = ref.current;
    if (cued || !el || rolled.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        roll();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, cued]);

  // Cued by a parent.
  useEffect(() => {
    if (cued && play) roll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cued, play]);

  return (
    <span ref={ref} className={className} style={{ display: "inline-flex" }}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" style={{ display: "inline-flex" }}>
        {Array.from(value).map((ch, i) =>
          /\d/.test(ch) ? (
            // The invisible digit sizes the window to its own glyph, so "12" doesn't space out like "0 0".
            <span
              key={i}
              style={{ position: "relative", display: "inline-block", height: "1em", overflow: "hidden", lineHeight: 1 }}
            >
              <span style={{ visibility: "hidden" }}>{ch}</span>
              <span
                data-strip={ch}
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  marginLeft: "-0.5em",
                  width: "1em",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transform: `translateY(${-Number(ch) * 10}%)`,
                }}
              >
                {Array.from({ length: 10 }, (_, d) => (
                  <span key={d} style={{ height: "1em" }}>
                    {d}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={i} style={{ lineHeight: 1 }}>
              {ch}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
