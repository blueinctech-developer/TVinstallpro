"use client";

import { useEffect, useId, useRef } from "react";
import { siteIntroPlaying } from "@/components/intro/introState";
import { LOGO_CLIPS, LOGO_STROKES, LOGO_VIEWBOX, type Clip } from "./logoData";
import styles from "./Logo.module.css";

const DELAY = 220; // default ms before the drawing point sets off
const DURATION = 3000; // default ms for the whole drawing pass
const OUTRO = 320; // ms for the drawing point to retire
const TRAIL = 26; // viewBox units of fresh "ink" that follows the point
const HEAD_R = 5.2;

// Relative cost per unit length: letterforms are drawn deliberately, the frame
// is a quick sweep and pen-up glides between strokes are quicker still.
const PACE = { letter: 1, rail: 0.5, glide: 0.35 };

type Segment =
  | { kind: "draw"; index: number; length: number; weight: number }
  | { kind: "glide"; from: DOMPoint; to: DOMPoint; weight: number };

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

type LogoProps = {
  /** Play the line-drawing intro once on mount. */
  animate?: boolean;
  /** Drawing pass length in ms. */
  duration?: number;
  /** Wait before the drawing point sets off, in ms. */
  delay?: number;
  /** Show the finished mark instead of drawing it while the site intro plays (the intro draws the logo itself). */
  deferToSiteIntro?: boolean;
  /** Colour scheme of the finished mark. */
  tone?: "default" | "inverse";
  className?: string;
};

export function Logo({
  animate = false,
  duration = DURATION,
  delay = DELAY,
  deferToSiteIntro = false,
  tone = "default",
  className,
}: LogoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!animate || !svg) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || (deferToSiteIntro && siteIntroPlaying())) {
      svg.dataset.state = "done";
      return;
    }

    const strokes = Array.from(svg.querySelectorAll<SVGPathElement>("[data-stroke]"));
    const trail = svg.querySelector<SVGPathElement>("[data-trail]");
    const head = svg.querySelector<SVGCircleElement>("[data-head]");
    if (!trail || !head) return;

    // Build the route: draw segments joined by straight pen-up glides.
    const segments: Segment[] = [];
    let prevEnd: DOMPoint | null = null;
    strokes.forEach((path, index) => {
      const length = path.getTotalLength();
      const start = path.getPointAtLength(0);
      if (prevEnd) {
        const gap = Math.hypot(start.x - prevEnd.x, start.y - prevEnd.y);
        if (gap > 0.5) segments.push({ kind: "glide", from: prevEnd, to: start, weight: gap * PACE.glide });
      }
      const pace = LOGO_STROKES[index].rail ? PACE.rail : PACE.letter;
      segments.push({ kind: "draw", index, length, weight: length * pace });
      prevEnd = path.getPointAtLength(length);
    });
    const total = segments.reduce((sum, s) => sum + s.weight, 0);

    let raf = 0;
    let t0 = 0;
    let trailOwner = -1;

    const placeHead = (x: number, y: number, scale: number) => {
      head.setAttribute("cx", x.toFixed(2));
      head.setAttribute("cy", y.toFixed(2));
      head.setAttribute("r", (HEAD_R * scale).toFixed(2));
    };

    const render = (progress: number, headScale: number) => {
      const pos = easeInOutSine(progress) * total;
      let acc = 0;
      let trailVisible = false;

      for (const seg of segments) {
        const from = acc;
        acc += seg.weight;

        if (seg.kind === "glide") {
          if (pos > from && pos < acc) {
            const f = (pos - from) / seg.weight;
            placeHead(seg.from.x + (seg.to.x - seg.from.x) * f, seg.from.y + (seg.to.y - seg.from.y) * f, headScale);
          }
          continue;
        }

        const path = strokes[seg.index];
        if (pos >= acc) {
          path.style.strokeDashoffset = "0";
        } else if (pos <= from) {
          path.style.strokeDashoffset = "1";
        } else {
          const f = (pos - from) / seg.weight;
          path.style.strokeDashoffset = String(1 - f);
          const pt = path.getPointAtLength(f * seg.length);
          placeHead(pt.x, pt.y, headScale);

          if (trailOwner !== seg.index) {
            trailOwner = seg.index;
            trail.setAttribute("d", path.getAttribute("d") ?? "");
            trail.setAttribute("stroke-width", path.getAttribute("stroke-width") ?? "1");
            const clip = path.getAttribute("clip-path");
            if (clip) trail.setAttribute("clip-path", clip);
            else trail.removeAttribute("clip-path");
          }
          const tl = Math.min(TRAIL / seg.length, f);
          trail.style.strokeDasharray = `${tl} 3`;
          trail.style.strokeDashoffset = String(tl - f);
          trailVisible = true;
        }
      }
      trail.style.opacity = trailVisible ? "1" : "0";
    };

    const tick = (now: number) => {
      if (!t0) t0 = now;
      const elapsed = now - t0 - delay;
      const progress = Math.min(1, Math.max(0, elapsed / duration));
      const intro = Math.min(1, Math.max(0, elapsed / 260));
      const outro = Math.min(1, Math.max(0, (elapsed - duration) / OUTRO));
      render(progress, intro * (1 - outro));

      if (outro < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        svg.dataset.state = "done";
      }
    };

    svg.dataset.state = "running";
    render(0, 0);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      strokes.forEach((p) => (p.style.strokeDashoffset = ""));
      delete svg.dataset.state;
    };
  }, [animate, duration, delay, deferToSiteIntro]);

  const clipId = (c: Clip) => `${uid}-${c}`;
  const { x, y, w, h } = LOGO_VIEWBOX;

  return (
    <svg
      ref={svgRef}
      className={[styles.logo, tone === "inverse" ? styles.inverse : "", className].filter(Boolean).join(" ")}
      viewBox={`${x} ${y} ${w} ${h}`}
      data-animate={animate ? "" : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {(Object.keys(LOGO_CLIPS) as Clip[]).map((c) => (
          <clipPath key={c} id={clipId(c)} clipPathUnits="userSpaceOnUse">
            {LOGO_CLIPS[c].map((r, i) => (
              <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} />
            ))}
          </clipPath>
        ))}
      </defs>

      <g fill="none" strokeLinejoin="miter" strokeMiterlimit={10}>
        {LOGO_STROKES.map((s, i) => (
          <path
            key={i}
            data-stroke=""
            d={s.d}
            pathLength={1}
            strokeWidth={s.w}
            className={s.tone === "blue" ? styles.blue : styles.ink}
            clipPath={s.clip ? `url(#${clipId(s.clip)})` : undefined}
          />
        ))}
        {animate && <path data-trail="" className={styles.trail} pathLength={1} d="M0 0" />}
      </g>
      {animate && <circle data-head="" className={styles.head} cx="21" cy="26.25" r="0" />}
    </svg>
  );
}
