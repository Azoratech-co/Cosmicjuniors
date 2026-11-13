"use client";

import dynamic from "next/dynamic";
import { Component, useRef, type ReactNode } from "react";
import type { Group } from "three";
import { landingView, type MarsLandingSite } from "@/lib/mars-landing-sites";
import styles from "./MarsLandingGlobe.module.css";

const Scene = dynamic(() => import("./MarsGlobeScene"), { ssr: false });

class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <p className={styles.notice}>The 3D globe is unavailable.</p> : this.props.children;
  }
}

export default function MarsLandingGlobe({ site }: { site: MarsLandingSite }) {
  const globe = useRef<Group | null>(null);
  const redraw = useRef<(() => void) | null>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);

  function rotate(x: number, y: number) {
    if (!globe.current) return;
    globe.current.rotation.y += x;
    globe.current.rotation.x = Math.max(-1.45, Math.min(1.45, globe.current.rotation.x + y));
    redraw.current?.();
  }

  function findLandingSite() {
    if (!globe.current) return;
    const { pitch, yaw } = landingView(site);
    globe.current.rotation.set(pitch, yaw, 0, "XYZ");
    redraw.current?.();
  }

  return (
    <section className={styles.card} aria-labelledby="opportunity-landing-title">
      <div className={styles.copy}>
        <h2 id="opportunity-landing-title">Where Opportunity landed</h2>
        <p><span className={styles.ring} style={{ borderColor: site.color }} aria-hidden="true" />{site.name}, Meridiani Planum</p>
        <p className={styles.coordinates}>1.95° S, 354.47° E</p>
        <button type="button" onClick={findLandingSite}>Find landing site</button>
        <div className={styles.sources}>
          <a href={site.source}>NASA mission</a>
          <a href="https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars">NASA Mars Trek imagery</a>
        </div>
      </div>
      <div
        className={styles.globe}
        role="group"
        aria-label="Mars globe. Drag or use arrow keys to rotate. Press Home to find the landing site."
        tabIndex={0}
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary || !globe.current) return;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const previous = drag.current;
          if (previous?.id !== event.pointerId) return;
          rotate((event.clientX - previous.x) * 0.009,
            event.pointerType === "touch" ? 0 : (event.clientY - previous.y) * 0.009);
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }}
        onLostPointerCapture={() => { drag.current = null; }}
        onKeyDown={(event) => {
          switch (event.key) {
            case "ArrowLeft": rotate(-0.18, 0); break;
            case "ArrowRight": rotate(0.18, 0); break;
            case "ArrowUp": rotate(0, -0.18); break;
            case "ArrowDown": rotate(0, 0.18); break;
            case "Home": findLandingSite(); break;
            default: return;
          }
          event.preventDefault();
        }}
      >
        <GlobeBoundary><Scene site={site} globe={globe} redraw={redraw} /></GlobeBoundary>
      </div>
    </section>
  );
}
