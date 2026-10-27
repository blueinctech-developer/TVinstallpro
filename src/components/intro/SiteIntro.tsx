"use client";

import { createTimeline, utils } from "animejs";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo/Logo";
import { SITE_INTRO_REVEAL, siteIntroPlaying } from "./introState";
import styles from "./SiteIntro.module.css";

const CONVERGE = 620; // ms: hairlines travel from the screen edges to the centre point
const LOGO_DELAY = 640; // ms: logo starts drawing as the lines meet
const LOGO_DRAW = 900; // ms: the moving line draws the wordmark
const REVEAL_AT = 1700; // ms: the screen parts along the axis, page animations begin
const PART = 760; // ms: the two halves slide apart
const LATE_START = 2600; // ms since navigation: if hydration is slower than this, skip the intro

let live = 0; // running intro instances

/**
 * Branded opening for the first home-page load of a session (axial composition):
 * hairlines enter from the four screen edges and meet at the centre, contract into the
 * logo's frame while the logo is drawn by its moving line, then the screen parts along
 * the central axis like two doors to reveal the hero beneath.
 *
 * Server-rendered but only visible while <html data-site-intro> is "play"/"revealing"
 * (set before paint by the layout script), so repeat visits, reduced motion and no-JS
 * never see it. CSS and a timer both guarantee it can never trap the page.
 */
export function SiteIntro() {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const root = ref.current;
    const html = document.documentElement;
    if (!root) return;

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      html.dataset.siteIntro = "revealing";
      window.dispatchEvent(new Event(SITE_INTRO_REVEAL));
    };
    const finish = () => {
      reveal();
      html.dataset.siteIntro = "done";
      history.scrollRestoration = "auto"; // the layout script set "manual" so the intro opens at the top
      setMounted(false);
    };

    if (!siteIntroPlaying()) {
      setMounted(false);
      return;
    }
    if (performance.now() > LATE_START) {
      finish();
      return;
    }

    const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T & HTMLElement>(s);
    const [hl, hr, vt, vb] = ["[data-h='l']", "[data-h='r']", "[data-v='t']", "[data-v='b']"].map((s) => q(s)!);
    const node = q("[data-node]")!;
    const logo = q("[data-logo]")!;
    const tag = q("[data-tag]")!;
    const stage = q("[data-stage]")!;
    const left = q("[data-door='l']")!;
    const right = q("[data-door='r']")!;

    window.scrollTo({ top: 0, behavior: "instant" });

    // How far the lines contract to: the logo's half-width and half-height.
    const box = logo.getBoundingClientRect();
    const sx = Math.min(1, box.width / 2 / (window.innerWidth / 2));
    const sy = Math.min(1, box.height / 2 / (window.innerHeight / 2));

    utils.set([hl, hr], { scaleX: 0 });
    utils.set([vt, vb], { scaleY: 0 });
    utils.set(node, { scale: 0, opacity: 0 });

    const tl = createTimeline({ defaults: { ease: "outExpo" }, onComplete: finish });
    tl
      // 1. Converge on the centre point.
      .add([hl, hr], { scaleX: [0, 1], duration: CONVERGE, ease: "inOutQuart" }, 0)
      .add([vt, vb], { scaleY: [0, 1], duration: CONVERGE, ease: "inOutQuart" }, 60)
      .add(node, { scale: [0, 1], opacity: [0, 1], duration: 420 }, CONVERGE - 40)
      // 2. Anchor each line at the centre and contract it into the logo's frame.
      .call(() => {
        utils.set(hl, { transformOrigin: "100% 50%" });
        utils.set(hr, { transformOrigin: "0% 50%" });
        utils.set(vt, { transformOrigin: "50% 100%" });
        utils.set(vb, { transformOrigin: "50% 0%" });
      }, CONVERGE + 20)
      .add([hl, hr], { scaleX: [1, sx], duration: 700, ease: "inOutQuart" }, CONVERGE + 40)
      .add([vt, vb], { scaleY: [1, sy], duration: 700, ease: "inOutQuart" }, CONVERGE + 40)
      .add([hl, hr, vt, vb, node], { opacity: [1, 0], duration: 500, ease: "outQuad" }, CONVERGE + 700)
      .add(logo, { opacity: [0.6, 1], scale: [0.97, 1], duration: 1200 }, LOGO_DELAY - 80)
      .add(tag, { opacity: [0, 1], translateY: [8, 0], duration: 800 }, 1150)
      // 3. Part along the axis.
      .call(reveal, REVEAL_AT)
      .add(stage, { opacity: [1, 0], scale: [1, 0.98], duration: 380, ease: "inQuad" }, REVEAL_AT)
      .add(left, { translateX: ["0%", "-100%"], duration: PART, ease: "inOutQuart" }, REVEAL_AT + 60)
      .add(right, { translateX: ["0%", "100%"], duration: PART, ease: "inOutQuart" }, REVEAL_AT + 60);

    // Animation frames can be throttled (e.g. a background tab); a timer still releases the page.
    const guard = window.setTimeout(finish, REVEAL_AT + PART + 1200);

    // Any intent to use the page skips straight to the reveal.
    const skip = () => {
      if (revealed) return;
      reveal();
      tl.seek(REVEAL_AT, true);
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, skip, { passive: true }));

    live += 1;
    return () => {
      events.forEach((e) => window.removeEventListener(e, skip));
      window.clearTimeout(guard);
      tl.revert();
      live -= 1;
      // Never leave the page scroll-locked if the intro unmounts mid-play (deferred for Strict Mode remounts).
      window.setTimeout(() => {
        if (live === 0 && html.dataset.siteIntro === "play") html.dataset.siteIntro = "done";
      }, 0);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div ref={ref} className={styles.intro} aria-hidden="true">
      <div className={styles.door} data-door="l" />
      <div className={styles.door} data-door="r" />
      <div className={styles.stage} data-stage="">
        <span className={`${styles.h} ${styles.hl}`} data-h="l" />
        <span className={`${styles.h} ${styles.hr}`} data-h="r" />
        <span className={`${styles.v} ${styles.vt}`} data-v="t" />
        <span className={`${styles.v} ${styles.vb}`} data-v="b" />
        <span className={styles.node} data-node="" />
        <div className={styles.center}>
          <div className={styles.logo} data-logo="">
            <Logo animate duration={LOGO_DRAW} delay={LOGO_DELAY} />
          </div>
          <p className={styles.tag} data-tag="">
            <span>Professional TV Installation ·</span> <span>Ottawa &amp; Gatineau</span>
          </p>
        </div>
      </div>
    </div>
  );
}
