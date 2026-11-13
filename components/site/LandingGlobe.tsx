"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import { marsRoverSites, opportunityLanding, type MarsLandingSite, type MarsRoverSite } from "@/lib/landing-sites";
import styles from "./LandingGlobe.module.css";
import { detailedCoordinates, getJourneyDefinition, getRouteSnapshot, routeCoordinates, solRange } from "@/lib/mars-journeys";
import MarsLandingInfo from "./MarsLandingInfo";
import MarsSitePicker from "./MarsSitePicker";
import { useMarsJourney } from "./useMarsJourney";

const Scene = dynamic(() => import("./LandingGlobeScene"), { ssr: false });
const ExplorerWindow = dynamic(() => import("./MarsExplorerWindow"), { ssr: false });

class GlobeBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function MarsLandingGlobe({ site }: { site: MarsLandingSite }) {
  // Keep the existing page's site prop: no explorer page integration change needed.
  const [selected, setSelected] = useState<MarsRoverSite>(() => marsRoverSites.find((entry) =>
    entry.latitude === site.latitude && entry.longitude === site.longitude) ?? opportunityLanding);
  const [focusVersion, setFocusVersion] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [windowMode, setWindowMode] = useState<"globe" | "journey">("globe");
  const [focusLatest, setFocusLatest] = useState(false);
  const journey = useMarsJourney(selected.id);
  const definition = getJourneyDefinition(selected.id);
  const snapshot = getRouteSnapshot(selected.id);
  const focusPoint = useMemo(() => focusLatest && snapshot ? routeCoordinates(snapshot.last) : undefined, [focusLatest, snapshot]);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const heading = useId();
  const instructions = useId();
  const globe = useRef<Group | null>(null);
  const redraw = useRef<(() => void) | null>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const onReady = useCallback(() => setStatus("ready"), []);
  const onError = useCallback(() => { drag.current = null; setStatus("failed"); }, []);

  function rotate(x: number, y: number) {
    if (!globe.current) return;
    globe.current.rotation.y += x;
    globe.current.rotation.x = Math.max(-1.45, Math.min(1.45, globe.current.rotation.x + y));
    redraw.current?.();
  }

  function selectSite(next: MarsRoverSite) {
    drag.current = null;
    setSelected(next);
    setFocusLatest(false);
    // Also re-center when the visitor picks the already selected rover after dragging.
    setFocusVersion((version) => version + 1);
  }

  return (
    <section className={styles.card} aria-labelledby={heading}>
      <header className={styles.header}>
        <button type="button" className={styles.expandButton} aria-label="Expand Mars explorer" title="Expand Mars explorer"
          aria-haspopup="dialog" onClick={() => { setWindowMode("globe"); setExpanded(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M9 4H4v5m11 11h5v-5M4 4l6 6m10 10-6-6M15 4h5v5M9 20H4v-5m16-11-6 6M4 20l6-6" />
          </svg>
        </button>
        <p className={styles.eyebrow}>Explore the Red Planet</p>
        <h2 id={heading}>Where the Mars rovers landed</h2>
        <p>Six rovers explored Mars. Two earlier rovers were sent there but never got to drive.</p>
      </header>

      <div className={styles.explorer}>
        <div className={styles.globePanel}>
          <div className={styles.globeStage}>
            <div className={styles.globe} role="group" aria-label="Interactive Mars landing-site globe"
              aria-describedby={instructions} tabIndex={status === "ready" ? 0 : undefined}
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
              onPointerUp={() => { drag.current = null; }}
              onPointerCancel={() => { drag.current = null; }}
              onLostPointerCapture={() => { drag.current = null; }}
              onKeyDown={(event) => {
                switch (event.key) {
                  case "ArrowLeft": rotate(-0.18, 0); break;
                  case "ArrowRight": rotate(0.18, 0); break;
                  case "ArrowUp": rotate(0, -0.18); break;
                  case "ArrowDown": rotate(0, 0.18); break;
                  case "Home": selectSite(selected); break;
                  default: return;
                }
                event.preventDefault();
              }}>
              {status !== "failed" && (
                <GlobeBoundary onError={onError}>
                  <Scene site={selected} sites={marsRoverSites} focusVersion={focusVersion} globe={globe}
                    redraw={redraw} onReady={onReady} onError={onError} journey={journey.data} focusPoint={focusPoint} />
                </GlobeBoundary>
              )}
            </div>
            {status !== "ready" && <p className={styles.notice} role="status">
              {status === "loading" ? "Loading Mars…" : "The 3D globe is unavailable. You can still compare rover landing coordinates."}
            </p>}
          </div>
          <p id={instructions} className={styles.hint}>Drag or use arrow keys to rotate Mars.</p>
          <button type="button" className={styles.findButton} disabled={status !== "ready"}
            onClick={() => selectSite(selected)}>Find {selected.rover}</button>
          {snapshot && <button type="button" className={styles.findButton} disabled={status !== "ready"}
            onClick={() => { setFocusLatest(true); setFocusVersion((value) => value + 1); }}>Find last mapped position</button>}
        </div>

        <div className={styles.details}>
          <p className={styles.eyebrow}>{selected.approximate ? "Earlier attempt · approximate site" : "Selected landing site"}</p>
          <h3><span className={styles.marker} data-approximate={selected.approximate}
            style={{ borderColor: selected.color, color: selected.color }} aria-hidden="true">●</span>{selected.rover}</h3>
          <details className={styles.comparison}>
            <summary>Compare different landing positions</summary>
            <MarsSitePicker selected={selected.id} onSelect={selectSite} />
            <p className={styles.note}>Dashed markers show approximate arrival sites for the two 1971 PrOP-M attempts.</p>
          </details>
          <MarsLandingInfo site={selected} />
          <div className={styles.journeySummary}>
            <strong>{definition.endpointLabel} · {definition.endpointArea}</strong>
            {snapshot && <p>{detailedCoordinates(snapshot.last)}<br />{solRange(snapshot.last)} · snapshot {snapshot.snapshotDate}</p>}
            {definition.contact && <p>{definition.contact.label}: {definition.contact.date}</p>}
            <button type="button" className={styles.findButton} onClick={() => { setWindowMode("journey"); setExpanded(true); }}>Explore {selected.rover} journey</button>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.sources}>
          <a href="https://www.giss.nasa.gov/tools/mars24/help/landers.html" target="_blank" rel="noopener noreferrer">NASA Mars24 · landing locations</a>
          <a href="https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars" target="_blank" rel="noopener noreferrer">NASA Mars Trek imagery</a>
        </div>
      </footer>
      {expanded && <ExplorerWindow site={selected} initialMode={windowMode} onSelect={selectSite} onClose={() => setExpanded(false)} />}
    </section>
  );
}
