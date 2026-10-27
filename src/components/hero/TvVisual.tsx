"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { afterSiteIntro } from "@/components/intro/introState";
import type { SceneState } from "./TvScene";
import styles from "./TvVisual.module.css";

// three.js loads only on the client, after the page is interactive.
const TvScene = dynamic(() => import("./TvScene"), { ssr: false });

/**
 * The 3D scene is ~240 KB of compressed JS. Phones, Data Saver and low-memory devices
 * get the static poster instead and never download it.
 */
function shouldUse3d() {
  if (window.matchMedia("(max-width: 760px)").matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  return webglAvailable();
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The hero TV. A CSS-rendered TV is server-rendered as the poster (and stays as the
 * fallback if WebGL is unavailable); the 3D scene fades in over it once it's ready.
 * `progress` is the hero's scroll progress, written by the parent.
 */
export function TvVisual({ progress }: { progress: React.RefObject<number> }) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef<SceneState>({ scroll: 0, px: 0, py: 0, entered: 0, still: false });
  const [use3d, setUse3d] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!shouldUse3d()) return;
    setUse3d(true);
    const s = state.current;
    s.still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (s.still) s.entered = 1;

    // Swing into place when the page is revealed.
    let raf = 0;
    const cancel = afterSiteIntro(() => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / 1400);
        s.entered = 1 - Math.pow(1 - t, 3);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });

    const onPointer = (e: PointerEvent) => {
      s.px = (e.clientX / window.innerWidth) * 2 - 1;
      s.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // Keep the scroll value in sync without re-rendering.
    let sync = 0;
    const tick = () => {
      s.scroll = progress.current ?? 0;
      sync = requestAnimationFrame(tick);
    };
    sync = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "10% 0px" });
    if (host.current) io.observe(host.current);

    return () => {
      cancel();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sync);
      window.removeEventListener("pointermove", onPointer);
      io.disconnect();
    };
  }, [progress]);

  return (
    <div ref={host} className={styles.visual} data-ready={ready || undefined} aria-hidden="true">
      {/* Poster / fallback */}
      <div className={styles.poster}>
        <span className={styles.wall} />
        <div className={styles.rig}>
          <span className={styles.plate} />
          <span className={styles.arm} />
          <div className={styles.panel}>
            <span className={styles.beam} />
          </div>
        </div>
      </div>
      {use3d && (
        <div className={styles.canvas}>
          <TvScene state={state} active={active} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}
