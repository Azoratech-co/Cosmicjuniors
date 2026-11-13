"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import { formatLandingCoordinates, marsRoverSites, opportunityLanding, type MarsLandingSite, type MarsRoverSite } from "@/lib/mars-landing-sites";
import styles from "./MarsLandingGlobe.module.css";
import { detailedCoordinates, getJourneyDefinition, getRouteSnapshot, routeCoordinates, solRange } from "@/lib/mars-journeys";
import { useMarsJourney } from "./useMarsJourney";

const Scene = dynamic(() => import("./MarsGlobeScene"), { ssr: false });
const ExplorerWindow = dynamic(() => import("./MarsExplorerWindow"), { ssr: false });
const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

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

  function renderList(entries: readonly MarsRoverSite[], label: string) {
    return (
      <ul className={styles.roverList} aria-label={label}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <button type="button" className={styles.roverButton} aria-pressed={selected.id === entry.id}
              onClick={() => selectSite(entry)}>
              <span className={styles.marker} data-approximate={entry.approximate}
                style={{ borderColor: entry.color, color: entry.color }} aria-hidden="true">●</span>
              <span className={styles.roverText}>
                <strong>{entry.rover}</strong>
                <span>{entry.region} · {entry.arrivalDate.slice(0, 4)}</span>
                <span className={styles.coordinates}>{formatLandingCoordinates(entry, entry.approximate)}</span>
              </span>
              <span className={styles.selection} aria-hidden="true">{selected.id === entry.id ? "✓" : ">"}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className={styles.card} aria-labelledby={heading}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Explore the Red Planet</p>
        <h2 id={heading}>Where the Mars rovers landed</h2>
        <p>Six rovers explored Mars. Two earlier rovers were sent there but never got to drive.</p>
        <p className={styles.note}>These markers show landing or arrival sites, not where the rovers are today.</p>
      </header>

      <div className={styles.explorer}>
        <div className={styles.globePanel}>
          <div className={styles.globeStage}>
            <button type="button" className={styles.expandButton} aria-label="Expand Mars explorer" title="Expand Mars explorer"
              aria-haspopup="dialog" onClick={() => { setWindowMode("globe"); setExpanded(true); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M9 4H4v5m11 11h5v-5M4 4l6 6m10 10-6-6M15 4h5v5M9 20H4v-5m16-11-6 6M4 20l6-6" />
              </svg>
            </button>
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
              {status === "loading" ? "Loading Mars…" : "The 3D globe is unavailable. You can still explore every rover and its coordinates below."}
            </p>}
          </div>
          <p id={instructions} className={styles.hint}>Drag or use arrow keys to rotate. Choose a rover below to see its site. Sites on the far side appear as you turn Mars.</p>
          <button type="button" className={styles.findButton} disabled={status !== "ready"}
            onClick={() => selectSite(selected)}>Find {selected.rover}</button>
          {snapshot && <button type="button" className={styles.findButton} disabled={status !== "ready"}
            onClick={() => { setFocusLatest(true); setFocusVersion((value) => value + 1); }}>Find last mapped position</button>}
          <p className={styles.hint}>○ Landing area · ◆ Last mapped / latest published position. Routes and nearby points overlap at planet scale; open Journey to inspect them.</p>
        </div>

        <div className={styles.details} aria-live="polite" aria-atomic="true">
          <p className={styles.eyebrow}>{selected.approximate ? "Earlier attempt · approximate site" : "Selected landing site"}</p>
          <h3><span className={styles.marker} data-approximate={selected.approximate}
            style={{ borderColor: selected.color, color: selected.color }} aria-hidden="true">●</span>{selected.rover}</h3>
          <p className={styles.place}>{selected.name}</p>
          <p>{selected.region}</p>
          <p className={styles.coordinates}>{formatLandingCoordinates(selected, selected.approximate)}</p>
          <p className={styles.date}>{selected.agency} · {selected.id === "mars-2-prop-m" ? "Impact" : "Landed"}{" "}
            <time dateTime={selected.arrivalDate}>{dateFormat.format(new Date(`${selected.arrivalDate}T00:00:00Z`))}</time> UTC</p>
          <p className={styles.summary}>{selected.summary}</p>
          {selected.approximate && <p className={styles.note}>Dashed marker: approximate lander location. This rover never drove on Mars.</p>}
          <div className={styles.sources}>
            <a href={selected.source} target="_blank" rel="noopener noreferrer">NASA mission reference</a>
            {selected.coordinateSource !== selected.source && <a href={selected.coordinateSource} target="_blank" rel="noopener noreferrer">NASA coordinates</a>}
          </div>
          <div className={styles.journeySummary}>
            <strong>{definition.endpointLabel} · {definition.endpointArea}</strong>
            {snapshot && <p>{detailedCoordinates(snapshot.last)}<br />{solRange(snapshot.last)} · snapshot {snapshot.snapshotDate}</p>}
            {definition.contact && <p>{definition.contact.label}: {definition.contact.date}</p>}
            <p>{definition.endpointNote}</p>
            <button type="button" className={styles.findButton} onClick={() => { setWindowMode("journey"); setExpanded(true); }}>Explore {selected.rover} journey</button>
          </div>
        </div>
      </div>

      <div className={styles.rosters}>
        <h3>Rovers that explored Mars</h3>
        {renderList(marsRoverSites.filter((entry) => entry.outcome === "explored"), "Choose a rover landing site")}
        <h3>Earlier attempts · 1971</h3>
        <p className={styles.note}>Both carried a PrOP-M mini-rover. Dashed markers show the approximate lander arrival sites, not confirmed rover positions.</p>
        {renderList(marsRoverSites.filter((entry) => entry.outcome === "not-deployed"), "Choose an earlier rover attempt")}
      </div>
      <footer className={styles.footer}>
        <p>Coordinates use north/south latitude and east longitude. Markers are enlarged so you can see them.</p>
        <div className={styles.sources}>
          <a href="https://www.giss.nasa.gov/tools/mars24/help/landers.html" target="_blank" rel="noopener noreferrer">NASA Mars24 · landing locations</a>
          <a href="https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars" target="_blank" rel="noopener noreferrer">NASA Mars Trek imagery</a>
        </div>
      </footer>
      {expanded && <ExplorerWindow site={selected} initialMode={windowMode} onSelect={selectSite} onClose={() => setExpanded(false)} />}
    </section>
  );
}
