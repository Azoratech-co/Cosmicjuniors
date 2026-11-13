"use client";

import dynamic from "next/dynamic";
import { Component, useId, useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import { GLOBE_MAPS, landingView, type LandingGlobeData, type LandingSite } from "@/lib/landing-sites";
import styles from "./LandingGlobe.module.css";

const Scene = dynamic(() => import("./LandingGlobeScene"), { ssr: false });

class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <p className={styles.notice}>The 3D globe is unavailable.</p> : this.props.children;
  }
}

export default function LandingGlobe({ data }: { data: LandingGlobeData }) {
  const [site, setSite] = useState<LandingSite>(data.sites[0]);
  const heading = useId();
  const planet = data.world === "moon" ? "Moon" : "Mars";
  const globe = useRef<Group | null>(null);
  const redraw = useRef<(() => void) | null>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);

  function rotate(x: number, y: number) {
    if (!globe.current) return;
    globe.current.rotation.y += x;
    globe.current.rotation.x = Math.max(-1.45, Math.min(1.45, globe.current.rotation.x + y));
    redraw.current?.();
  }

  function findLandingSite(target: LandingSite = site) {
    setSite(target);
    if (!globe.current) return;
    const { pitch, yaw } = landingView(target);
    globe.current.rotation.set(pitch, yaw, 0, "XYZ");
    redraw.current?.();
  }

  return (
    <section className={styles.card} aria-labelledby={heading}>
      <div className={styles.copy}>
        <h2 id={heading}>{data.title}</h2>
        {data.sites.length > 1 ? (
          <ul className={styles.sites}>
            {data.sites.map((s) => (
              <li key={s.name}>
                <button type="button" aria-pressed={s === site} onClick={() => findLandingSite(s)}>
                  <span className={styles.ring} style={{ borderColor: s.color }} aria-hidden="true" />
                  <span className={styles.siteText}><strong>{s.label}</strong><span>{s.region}</span><small>{s.coordinates}</small></span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p><span className={styles.ring} style={{ borderColor: site.color }} aria-hidden="true" />{site.name}, {site.region}</p>
            <p className={styles.coordinates}>{site.coordinates}</p>
            <button type="button" onClick={() => findLandingSite()}>Find landing site</button>
          </>
        )}
        <div className={styles.sources}>
          <a href={data.source.url}>{data.source.label}</a>
          <a href={GLOBE_MAPS[data.world].url}>{GLOBE_MAPS[data.world].label}</a>
        </div>
      </div>
      <div
        className={styles.globe}
        role="group"
        aria-label={`${planet} globe. Drag or use arrow keys to rotate. Press Home to find the landing site.`}
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
        <GlobeBoundary><Scene data={data} globe={globe} redraw={redraw} /></GlobeBoundary>
      </div>
    </section>
  );
}
