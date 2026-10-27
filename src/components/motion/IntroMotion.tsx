"use client";

import { createTimeline, stagger, svg, utils } from "animejs";
import { useEffect, useRef, type ReactNode } from "react";
import { afterSiteIntro } from "@/components/intro/introState";

/**
 * Plays a page's opening sequence once:
 *  [data-char]        characters rise out of their word masks (staggered)
 *  [data-intro-wipe]  colour panels wipe away to reveal imagery
 *  [data-intro-draw]  SVG strokes draw on
 *  [data-intro-item]  supporting elements fade up in order
 * Until it runs, CSS (gated on the `.js` class, with a timed failsafe) holds the
 * start state, so there is no flash of final content before hydration.
 */
export function IntroMotion({
  children,
  className,
  header,
}: {
  children: ReactNode;
  className?: string;
  /** "dark" tells the site header it sits over a dark section */
  header?: "dark";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.intro = "done";
      return;
    }

    let tl: ReturnType<typeof createTimeline> | undefined;

    const play = () => {
      const chars = root.querySelectorAll<HTMLElement>("[data-char]");
      const items = root.querySelectorAll<HTMLElement>("[data-intro-item]");
      const wipes = root.querySelectorAll<HTMLElement>("[data-intro-wipe]");
      const drawables = svg.createDrawable(root.querySelectorAll<SVGPathElement>("[data-intro-draw]"));

      // Pin the start state inline, then release the CSS hold.
      if (chars.length) utils.set(chars, { translateY: "110%" });
      if (items.length) utils.set(items, { opacity: 0, translateY: 26 });
      if (wipes.length) utils.set(wipes, { scaleX: 1 });
      if (drawables.length) utils.set(drawables, { draw: "0 0" });
      root.dataset.intro = "running";

      tl = createTimeline({
        defaults: { ease: "outExpo" },
        onComplete: () => {
          root.dataset.intro = "done";
        },
      });

      // Not every page header has every kind of target; skip empty ones.
      if (chars.length) tl.add(chars, { translateY: ["110%", "0%"], duration: 1150, delay: stagger(24) }, 0);
      if (wipes.length) tl.add(wipes, { scaleX: [1, 0], duration: 1200, ease: "inOutQuart" }, 120);
      if (items.length) tl.add(items, { opacity: [0, 1], translateY: [26, 0], duration: 1100, delay: stagger(90) }, 380);
      if (drawables.length) tl.add(drawables, { draw: ["0 0", "0 1"], duration: 900, ease: "inOutCubic" }, 820);
    };

    // On the home page's first load the branded intro covers this section; start as it lifts.
    const cancelWait = afterSiteIntro(play);

    return () => {
      cancelWait();
      tl?.revert();
      root.dataset.intro = "pending";
    };
  }, []);

  return (
    <section ref={ref} className={className} data-intro="pending" data-header={header}>
      {children}
    </section>
  );
}
