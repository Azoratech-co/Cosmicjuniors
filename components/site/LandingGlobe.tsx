"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import type { LandingSiteDetails } from "@/lib/landing-sites";
import { GLOBE_MAPS, type LandingExplorerConfig } from "@/lib/mission-landing-sites";
import styles from "./LandingGlobe.module.css";
import type { LandingMarkerProjection } from "./LandingGlobeScene";
import { positionMarsLeader } from "./positionMarsLeader";
import LandingSiteInfo from "./MarsLandingInfo";
import MarsJourneyEndpoint from "./MarsJourneyEndpoint";
import LandingSitePicker from "./MarsSitePicker";
import { useMarsJourney } from "./useMarsJourney";

const Scene = dynamic(() => import("./LandingGlobeScene"), { ssr: false });
const ExplorerWindow = dynamic(() => import("./MarsExplorerWindow"), { ssr: false });

class GlobeBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function LandingGlobe({ config, original }: { config: LandingExplorerConfig; original: LandingSiteDetails }) {
  const { name, sites, world, surfaceJourneys } = config;
  const imagery = GLOBE_MAPS[world];
  const [selected, setSelected] = useState(original);
  const comparison = selected.id !== original.id ? selected : null;
  const [focusVersion, setFocusVersion] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [windowMode, setWindowMode] = useState<"globe" | "journey">("globe");
  const journey = useMarsJourney(selected.id);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const heading = useId();
  const instructions = useId();
  const globe = useRef<Group | null>(null);
  const redraw = useRef<(() => void) | null>(null);
  const cancelFocus = useRef<(() => void) | null>(null);
  const explorer = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const originalCard = useRef<HTMLElement>(null);
  const comparisonCard = useRef<HTMLElement>(null);
  const originalLeader = useRef<SVGSVGElement>(null);
  const comparisonLeader = useRef<SVGSVGElement>(null);
  const originalPoint = useRef<LandingMarkerProjection | null>(null);
  const comparisonPoint = useRef<LandingMarkerProjection | null>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const onReady = useCallback(() => setStatus("ready"), []);
  const onError = useCallback(() => { drag.current = null; setStatus("failed"); }, []);

  const drawLeaders = useCallback(() => {
    positionMarsLeader(originalLeader.current, viewport.current, originalCard.current, originalPoint.current);
    positionMarsLeader(comparisonLeader.current, viewport.current, comparisonCard.current, comparisonPoint.current);
  }, []);
  const projectOriginal = useCallback((point: LandingMarkerProjection | null) => {
    originalPoint.current = point;
    drawLeaders();
  }, [drawLeaders]);
  const projectComparison = useCallback((point: LandingMarkerProjection | null) => {
    comparisonPoint.current = point;
    drawLeaders();
  }, [drawLeaders]);

  useEffect(() => {
    const observer = new ResizeObserver(drawLeaders);
    for (const element of [explorer.current, viewport.current, originalCard.current, comparisonCard.current]) {
      if (element) observer.observe(element);
    }
    window.addEventListener("scroll", drawLeaders, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", drawLeaders);
    };
  }, [comparison, drawLeaders]);

  function rotate(x: number, y: number) {
    if (!globe.current) return;
    cancelFocus.current?.();
    globe.current.rotation.y += x;
    globe.current.rotation.x = Math.max(-1.45, Math.min(1.45, globe.current.rotation.x + y));
    redraw.current?.();
  }

  function selectSite(next: LandingSiteDetails) {
    drag.current = null;
    setSelected(next);
    // Also re-center when the visitor picks the already selected site after dragging.
    setFocusVersion((version) => version + 1);
  }

  return (
    <section className={styles.card} aria-labelledby={heading}>
      <header className={styles.header}>
        <button type="button" className={styles.expandButton} aria-label={`Expand ${name} explorer`} title={`Expand ${name} explorer`}
          aria-haspopup="dialog" onClick={() => { setWindowMode("globe"); setExpanded(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M9 4H4v5m11 11h5v-5M4 4l6 6m10 10-6-6M15 4h5v5M9 20H4v-5m16-11-6 6M4 20l6-6" />
          </svg>
        </button>
        <h2 id={heading}>{config.title}</h2>
      </header>

      <div ref={explorer} className={styles.explorer}>
        <div className={styles.globePanel}>
          <div className={styles.globeStage}>
            <div ref={viewport} className={styles.globe} role="group" aria-label={`Interactive ${name} landing-site globe`}
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
                  <Scene world={world} site={selected} sites={sites} focusVersion={focusVersion} globe={globe}
                    redraw={redraw} cancelFocus={cancelFocus} onReady={onReady} onError={onError} journey={journey.data}
                    showJourneyEndpoints={surfaceJourneys}
                    referenceSite={original} onProjectReference={projectOriginal} onProjectMarker={projectComparison} />
                </GlobeBoundary>
              )}
            </div>
            {status !== "ready" && <p className={styles.notice} role="status">
              {status === "loading" ? `Loading ${name}…` : "The 3D globe is unavailable. You can still compare landing coordinates."}
            </p>}
          </div>
          <p id={instructions} className={styles.hint}>Drag or use arrow keys to rotate {world === "moon" ? "the Moon" : name}.</p>
          {comparison && (
            <section key={comparison.id} ref={comparisonCard} className={`${styles.infoCard} ${styles.comparisonCard}`}
              aria-label={`${comparison.rover} comparison information`} aria-live="polite">
              <LandingSiteInfo site={comparison} showMission reveal action={surfaceJourneys &&
                <button type="button" className={styles.findButton} onClick={() => { setWindowMode("journey"); setExpanded(true); }}>
                  {`Explore ${comparison.rover} journey`}
                </button>
              } />
            </section>
          )}
        </div>

        {status === "ready" && (
          <svg ref={originalLeader} className={styles.leader} data-visible="true" aria-hidden="true">
            <line /><circle r="3" fill={original.color} />
          </svg>
        )}
        {status === "ready" && comparison && (
          <svg ref={comparisonLeader} className={styles.leader} data-visible="true" aria-hidden="true">
            <line /><circle r="3" fill={comparison.color} />
          </svg>
        )}
        <div className={styles.details}>
          <p className={styles.eyebrow}>Landing site</p>
          <div className={styles.siteTitle}>
            <h3><span className={styles.marker} data-approximate={original.approximate}
              style={{ borderColor: original.color, color: original.color }} aria-hidden="true">&#9679;</span>{original.rover}</h3>
            <button type="button" className={styles.locateButton} disabled={status !== "ready"}
              title={`Locate ${original.rover}'s landing site`} onClick={() => selectSite(original)}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="10" cy="10" r="5.5" />
                <circle cx="10" cy="10" r="1.5" />
                <path d="M10 2v3m0 10v3M2 10h3m10 0h3" />
              </svg>
              Locate it
            </button>
          </div>
          <section ref={originalCard} className={styles.infoCard} aria-label={`${original.rover} landing information`}>
            <LandingSiteInfo site={original} />
          </section>
          <section className={styles.comparison} aria-labelledby={`${heading}-comparison`}>
            <h4 id={`${heading}-comparison`}>Compare different landing positions</h4>
            <LandingSitePicker sites={sites} selected={selected.id} onSelect={selectSite} />
            <p className={styles.note}>{config.comparisonNote}</p>
          </section>
        </div>
        {surfaceJourneys && <div className={styles.journeySummary}>
          <MarsJourneyEndpoint site={original} />
          <button type="button" className={styles.findButton} onClick={() => { selectSite(original); setWindowMode("journey"); setExpanded(true); }}>Explore {original.rover} journey</button>
        </div>}
      </div>

      <footer className={styles.footer}>
        <div className={styles.sources}>
          <a href={config.coordinateReference.url} target="_blank" rel="noopener noreferrer">{config.coordinateReference.label}</a>
          <a href={imagery.url} target="_blank" rel="noopener noreferrer">{imagery.label}</a>
        </div>
      </footer>
      {expanded && <ExplorerWindow config={config} site={selected} initialMode={windowMode} onSelect={selectSite} onClose={() => setExpanded(false)} />}
    </section>
  );
}
