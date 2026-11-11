"use client";

import { useEffect, useRef } from "react";
import Planet from "./Planet";

// The Figma journey panel: Mars at the top, Earth at the bottom, the white dashed trajectory between
// them. As you scroll past it, the rocket flies along the path from Earth up to Mars.

// Points along the Figma trajectory (280 x 790 frame), top to bottom.
const PATH: [number, number][] = [[140.0, 10.0], [126.8, 26.8], [110.0, 50.5], [95.5, 75.7], [85.0, 102.8], [81.4, 131.6], [86.9, 160.0], [100.3, 185.8], [118.4, 208.5], [139.1, 228.8], [160.5, 248.5], [179.1, 270.7], [192.9, 296.0], [199.7, 324.1], [199.1, 352.9], [192.8, 381.1], [183.1, 408.4], [171.2, 434.8], [158.3, 460.6], [144.7, 486.2], [132.0, 513.3], [126.4, 542.9], [129.6, 572.8], [139.6, 601.3], [152.9, 628.5], [165.8, 655.8], [174.7, 684.7], [174.7, 714.7], [164.5, 743.1], [142.0, 774.0]];

const lengths = PATH.slice(1).map(([x, y], i) => Math.hypot(x - PATH[i][0], y - PATH[i][1]));
const TOTAL = lengths.reduce((a, b) => a + b, 0);

/** Point and heading at a share (0 = top/Mars, 1 = bottom/Earth) of the path. */
function along(t: number) {
  let d = Math.max(0, Math.min(1, t)) * TOTAL;
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const k = lengths[i] ? Math.min(1, d / lengths[i]) : 0;
      const [x1, y1] = PATH[i];
      const [x2, y2] = PATH[i + 1];
      // The rocket flies upward (from Earth to Mars), so it faces from point 2 toward point 1.
      const angle = (Math.atan2(x1 - x2, y2 - y1) * 180) / Math.PI;
      return { x: x1 + (x2 - x1) * k, y: y1 + (y2 - y1) * k, angle };
    }
    d -= lengths[i];
  }
  return { x: PATH[0][0], y: PATH[0][1], angle: 0 };
}

export default function JourneyPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const rocket = rocketRef.current;
    if (!panel || !rocket) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const place = () => {
      raf = 0;
      const r = panel.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the panel's top reaches the bottom of the screen, 1 when its bottom leaves the top.
      const seen = reduce ? 0.5 : (vh - r.top) / (vh + r.height);
      const p = along(1 - Math.max(0, Math.min(1, (seen - 0.1) / 0.8)));
      rocket.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${p.angle}deg)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="journey" ref={panelRef} aria-label="A rocket flying from Earth to Mars" role="img">
      <Planet kind="mars" size={160} className="journey__mars" />
      <div className="journey__track">
        {/* eslint-disable @next/next/no-img-element */}
        <img src="/figma/trajectory.svg" alt="" width={280} height={790} />
        <img ref={rocketRef} className="journey__rocket" src="/figma/rocket.svg" alt="" width={68} height={166} />
      </div>
      <Planet kind="earth" size={177} className="journey__earth" />
    </div>
  );
}
