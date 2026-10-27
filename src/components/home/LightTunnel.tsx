"use client";

import { useEffect, useRef } from "react";

type P = { x: number; y: number; z: number; hue: number };

/**
 * Mirror-symmetric light tunnel on the central axis (Canvas 2D, no WebGL).
 * Light dashes stream toward the viewer and outward from the axis.
 * Renders only while visible; one still frame for reduced motion.
 */
export function LightTunnel({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 760px)").matches;
    const COUNT = small ? 90 : 200; // mirrored, so twice as many dashes on screen

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Pre-rendered streaks (fade-in tail → bright head), one per colour and direction.
    // Stamping these with drawImage is far cheaper than building a gradient per dash per frame.
    const COLORS = ["10,124,234", "94,176,250", "255,255,255"];
    const makeSprite = (rgb: string, dir: 1 | -1) => {
      const c = document.createElement("canvas");
      c.width = 128;
      c.height = 4;
      const g = c.getContext("2d")!;
      const grad = g.createLinearGradient(dir === 1 ? 0 : 128, 0, dir === 1 ? 128 : 0, 0);
      grad.addColorStop(0, `rgba(${rgb},0)`);
      grad.addColorStop(1, `rgba(${rgb},1)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 4);
      return c;
    };
    const sprites = COLORS.map((rgb) => ({ right: makeSprite(rgb, 1), left: makeSprite(rgb, -1) }));

    // Particles live on one side (x ≥ 0) and are drawn mirrored across the axis.
    const spawn = (p: Partial<P> = {}): P => ({
      x: Math.random() * 1.6 + 0.05,
      y: (Math.random() - 0.5) * 1.2,
      z: p.z ?? Math.random() * 4 + 0.2,
      hue: Math.random(),
    });
    const ps: P[] = Array.from({ length: COUNT }, () => spawn());

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const f = Math.min(w, h) * 0.9; // focal length

      for (const p of ps) {
        p.z -= dt * 0.45;
        if (p.z <= 0.15) Object.assign(p, spawn({ z: 4.2 }));

        const sx = (p.x / p.z) * f;
        const sy = (p.y / p.z) * f;
        if (Math.abs(sy) > h) continue;
        const len = Math.min(w * 0.4, (0.35 / p.z) * f * 0.55);
        const thick = Math.max(0.6, 2.2 / p.z);
        const sprite = sprites[p.hue > 0.82 ? 2 : p.hue > 0.4 ? 1 : 0];
        const y = cy + sy - thick / 2;
        ctx.globalAlpha = Math.min(1, (4.2 - p.z) / 2.2) * 0.9;
        // right of the axis (streak heads point outward), mirrored on the left
        ctx.drawImage(sprite.right, cx + sx, y, len, thick);
        ctx.drawImage(sprite.left, cx - sx - len, y, len, thick);
      }
      ctx.globalAlpha = 1;
    };

    if (reduce) {
      draw(0);
      return () => ro.disconnect();
    }

    let raf = 0;
    let last = 0;
    let running = false;
    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      draw(dt);
      if (running) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(loop);
      } else if (!e.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
