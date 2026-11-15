"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { Component, useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { Group } from "three";
import type { LandingSiteDetails } from "@/lib/landing-sites";
import type { LandingExplorerConfig } from "@/lib/mission-landing-sites";
import styles from "./MarsExplorerWindow.module.css";
import calloutStyles from "./LandingGlobe.module.css";
import { getRouteSnapshot, routeCoordinates } from "@/lib/mars-journeys";
import type { LandingMarkerProjection } from "./LandingGlobeScene";
import { positionMarsLeader } from "./positionMarsLeader";
import LandingSiteInfo from "./MarsLandingInfo";
import LandingSitePicker from "./MarsSitePicker";
import { useMarsJourney } from "./useMarsJourney";
import { initialGlobeView, surfaceReferences, type SurfaceStatus } from "@/lib/globe-surface";

const Scene = dynamic(() => import("./LandingGlobeScene"), { ssr: false });
const JourneyPanel = dynamic(() => import("./MarsJourneyPanel"), { ssr: false });
const initialCamera = initialGlobeView;

class WindowBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

type Props = {
  config: LandingExplorerConfig;
  site: LandingSiteDetails;
  initialMode?: "globe" | "journey";
  onSelect: (site: LandingSiteDetails) => void;
  onClose: () => void;
};

export default function LandingExplorerWindow({ config, site, initialMode = "globe", onSelect, onClose }: Props) {
  const { name, sites, world, surfaceJourneys } = config;
  const dialog = useRef<HTMLDialogElement>(null);
  const globe = useRef<Group | null>(null);
  const redraw = useRef<(() => void) | null>(null);
  const cancelFocus = useRef<(() => void) | null>(null);
  const pickSite = useRef<((x: number, y: number) => LandingSiteDetails | undefined) | null>(null);
  const tap = useRef<{ id: number; x: number; y: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [camera, setCamera] = useState(initialCamera);
  const [surfaceStatus, setSurfaceStatus] = useState<SurfaceStatus>("loading");
  const [detailAttempt, setDetailAttempt] = useState(0);
  const onDetailStatus = useCallback((value: SurfaceStatus) => setSurfaceStatus(value), []);
  const [focusVersion, setFocusVersion] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const information = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const leader = useRef<SVGSVGElement>(null);
  const marker = useRef<LandingMarkerProjection | null>(null);
  const [visibleSite, setVisibleSite] = useState<string | null>(null);
  const [mode, setMode] = useState(initialMode);
  const [focusLatest, setFocusLatest] = useState(false);
  const snapshot = surfaceJourneys ? getRouteSnapshot(site.id) : undefined;
  const journey = useMarsJourney(site.id);
  const focusPoint = useMemo(() => focusLatest && snapshot ? routeCoordinates(snapshot.last) : undefined, [focusLatest, snapshot]);
  const title = useId();
  const hint = useId();
  const onReady = useCallback(() => setStatus("ready"), []);
  const onError = useCallback(() => { pointers.current.clear(); tap.current = null; setStatus("failed"); }, []);

  const drawLeader = useCallback(() => {
    positionMarsLeader(leader.current, viewport.current, information.current, marker.current,
      information.current?.parentElement);
  }, []);

  const projectMarker = useCallback((point: LandingMarkerProjection | null) => {
    const previous = marker.current?.siteId ?? null;
    marker.current = point;
    const next = point?.siteId ?? null;
    if (next !== previous) setVisibleSite(next);
    drawLeader();
  }, [drawLeader]);
  const calloutVisible = status !== "ready" || visibleSite === site.id;

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (mode === "globe" && infoOpen) {
      information.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
      drawLeader();
    }
  }, [drawLeader, infoOpen, mode, site.id, calloutVisible]);

  function close() {
    if (closing) return;
    const finish = () => { dialog.current?.close(); onClose(); };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    setClosing(true);
    closeTimer.current = setTimeout(finish, 200);
  }

  function findSite() {
    setFocusLatest(false);
    setCamera((current) => ({ ...current, autoRotate: false }));
    setFocusVersion((value) => value + 1);
  }

  function selectLandingSite(next: LandingSiteDetails) {
    onSelect(next);
    findSite();
    setInfoOpen(true);
  }

  function zoom(factor: number) {
    setCamera((current) => ({ ...current, zoom: Math.max(0.7, Math.min(2.6, current.zoom * factor)) }));
  }

  function rotate(x: number, y: number) {
    if (!globe.current) return;
    cancelFocus.current?.();
    globe.current.rotation.y += x;
    globe.current.rotation.x = Math.max(-1.45, Math.min(1.45, globe.current.rotation.x + y));
    redraw.current?.();
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (status !== "ready" || event.button !== 0 || pointers.current.size >= 2) return;
    setCamera((current) => current.autoRotate ? { ...current, autoRotate: false } : current);
    tap.current = pointers.current.size === 0
      ? { id: event.pointerId, x: event.clientX, y: event.clientY }
      : null;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    const start = tap.current;
    if (start && Math.hypot(next.x - start.x, next.y - start.y) <= 5) return;
    tap.current = null;
    pointers.current.set(event.pointerId, next);
    if (pointers.current.size === 2) {
      const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)?.[1];
      if (!other) return;
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      if (before > 8 && after > 8) zoom(after / before);
    } else rotate((next.x - previous.x) * 0.007, (next.y - previous.y) * 0.007);
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    const start = tap.current;
    if (start?.id !== event.pointerId) return;
    tap.current = null;
    if (event.type !== "pointerup" || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * event.currentTarget.clientWidth / bounds.width;
    const y = (event.clientY - bounds.top) * event.currentTarget.clientHeight / bounds.height;
    const hit = pickSite.current?.(x, y);
    if (hit) selectLandingSite(hit);
  }

  // Wheel handling stays inside the modal globe and leaves browser Ctrl+wheel zoom alone.
  useEffect(() => {
    const element = viewport.current;
    if (!element || status !== "ready") return;
    function wheel(event: WheelEvent) {
      if (event.ctrlKey) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 240 : 1;
      zoom(Math.exp(-Math.max(-200, Math.min(200, event.deltaY * unit)) * 0.001));
    }
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [status]);

  return createPortal(
    <dialog ref={dialog} className={styles.dialog} data-closing={closing} aria-labelledby={title}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const elements = [...event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
        )].filter((element) => element.getClientRects().length > 0);
        const first = elements[0];
        const last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last && first) {
          event.preventDefault(); first.focus();
        }
      }}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className={styles.window} data-mode={mode} data-world={world}>
        <header className={styles.titlebar}>
          <span className={styles.planetIcon} aria-hidden="true" />
          <h2 id={title}>{name} explorer</h2>
          {surfaceJourneys && <div className={styles.viewTabs} role="group" aria-label="Explorer view">
            <button type="button" aria-pressed={mode === "globe"} onClick={() => setMode("globe")}>Globe</button>
            <button type="button" aria-pressed={mode === "journey"} onClick={() => { setMode("journey"); setCamera((current) => ({ ...current, autoRotate: false })); }}>Journey</button>
          </div>}
          <button type="button" className={styles.close} aria-label={`Close ${name} explorer`} onClick={close} autoFocus>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
          </button>
        </header>

        <div className={styles.space}>
          <div ref={viewport} className={styles.viewport} hidden={mode !== "globe"} role="group" aria-label={`Expanded ${name} globe`} aria-describedby={hint}
            tabIndex={status === "ready" ? 0 : undefined} onPointerDown={pointerDown} onPointerMove={pointerMove}
            onPointerUp={endPointer} onPointerCancel={endPointer} onLostPointerCapture={endPointer}
            onKeyDown={(event) => {
              switch (event.key) {
                case "ArrowLeft": rotate(-0.15, 0); break;
                case "ArrowRight": rotate(0.15, 0); break;
                case "ArrowUp": rotate(0, -0.15); break;
                case "ArrowDown": rotate(0, 0.15); break;
                case "+": case "=": zoom(1.1); break;
                case "-": zoom(1 / 1.1); break;
                case "Home": setCamera(initialCamera); findSite(); break;
                default: return;
              }
              event.preventDefault();
            }}>
            {status !== "failed" && <WindowBoundary onError={onError}>
              <Scene world={world} site={site} sites={sites} focusVersion={focusVersion} globe={globe} redraw={redraw} cancelFocus={cancelFocus}
                onReady={onReady} onError={onError} view={camera} journey={journey.data} focusPoint={focusPoint}
                showJourneyEndpoints={surfaceJourneys}
                onProjectMarker={projectMarker} pickSite={pickSite} detailEnabled={mode === "globe"}
                detailAttempt={detailAttempt} onDetailStatus={onDetailStatus} />
            </WindowBoundary>}
          </div>
          {mode === "globe" && status !== "ready" && <p className={styles.notice} role="status">
            {status === "loading" ? `Loading ${name}…` : "The 3D globe is unavailable. You can still compare landing sites."}
          </p>}
          {mode === "journey" && <JourneyPanel key={site.id} site={site} data={journey.data} loading={journey.loading} failed={journey.failed} retry={journey.retry} />}

          <div className={styles.surfaceCredits} hidden={mode !== "globe"}>
            <span role="status">{surfaceStatus === "ready" ? "Detailed NASA surface" : surfaceStatus === "failed" ? "Standard surface" : "Loading surface detail…"}</span>
            {surfaceStatus === "failed" && <button type="button" onClick={() => setDetailAttempt((value) => value + 1)}>Retry detail</button>}
            <a href={surfaceReferences[world].color} target="_blank" rel="noopener noreferrer">NASA imagery</a>
            <a href={surfaceReferences[world].elevation} target="_blank" rel="noopener noreferrer">Terrain source</a>
          </div>
          <p id={hint} className={styles.hint} hidden={mode !== "globe"}>Drag to rotate &middot; Scroll or pinch to zoom</p>
        </div>
        {mode === "globe" && infoOpen && (
          <svg ref={leader} className={calloutStyles.leader} data-visible={visibleSite === site.id && status === "ready"} aria-hidden="true">
            <line />
            <circle r="3" fill={site.color} />
          </svg>
        )}
        <aside className={styles.controls} aria-label={`${name} explorer controls`} onScroll={drawLeader}>
          {mode === "globe" && (
            <section ref={information} id={`${title}-site-info`} className={`${calloutStyles.infoCard} ${calloutStyles.callout}`} aria-label="Landing site information"
              aria-live="polite" hidden={!infoOpen} data-visible={calloutVisible} inert={!calloutVisible}>
              <LandingSiteInfo site={site} showMission reveal={infoOpen && calloutVisible} />
            </section>
          )}
          <section className={styles.sitePanel} aria-label="Landing sites">
            <h3 className={styles.siteHeading}>Landing sites</h3>
            <LandingSitePicker sites={sites} selected={site.id} onSelect={selectLandingSite} />
            {mode === "globe" && (
              <div className={styles.infoToggle}>
                <button type="button" className={styles.reset} aria-expanded={infoOpen} aria-controls={`${title}-site-info`}
                  onClick={() => setInfoOpen((value) => !value)}>
                  {infoOpen ? "Hide site information" : "Show site information"}
                </button>
              </div>
            )}
          </section>
          <section className={styles.cameraPanel} hidden={mode !== "globe"} aria-label="Camera controls">
            <button type="button" className={styles.panelToggle} aria-expanded={panelOpen} aria-controls={`${title}-camera`}
              onClick={() => setPanelOpen((value) => !value)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 7h4l2-3h4l2 3h4v13H4Z" /><circle cx="12" cy="13" r="4" /></svg>
              Camera <span aria-hidden="true">{panelOpen ? "−" : "+"}</span>
            </button>
            <div id={`${title}-camera`} className={styles.panelBody} hidden={!panelOpen}>
              <fieldset disabled={status !== "ready"}>
                <legend>Adjust your view</legend>
                <label>Zoom <output>{Math.round(camera.zoom * 100)}%</output>
                  <input aria-label="Camera zoom" type="range" min="0.7" max="2.6" step="0.01" value={camera.zoom}
                    onChange={(event) => setCamera((current) => ({ ...current, zoom: Number(event.target.value) }))} />
                </label>
                <label>Field of view <output>{camera.fov}°</output>
                  <input aria-label="Camera field of view" type="range" min="30" max="70" step="1" value={camera.fov}
                    onChange={(event) => setCamera((current) => ({ ...current, fov: Number(event.target.value) }))} />
                </label>
                <label className={styles.switch}><span>Surface relief</span><input type="checkbox" checked={camera.relief}
                  onChange={(event) => setCamera((current) => ({ ...current, relief: event.target.checked }))} /></label>
                <label>Light direction <output>{camera.lightAngle}°</output>
                  <input aria-label="Light direction" type="range" min="-120" max="120" step="1" value={camera.lightAngle}
                    onChange={(event) => setCamera((current) => ({ ...current, lightAngle: Number(event.target.value) }))} />
                </label>
                <label className={styles.switch}><span>Slow rotation</span><input type="checkbox" checked={camera.autoRotate}
                  onChange={(event) => setCamera((current) => ({ ...current, autoRotate: event.target.checked }))} /></label>
                <button type="button" className={styles.reset} onClick={() => { setCamera(initialCamera); findSite(); }}>Reset camera</button>
                {snapshot && <button type="button" className={styles.reset} onClick={() => {
                  setFocusLatest(true); setCamera((current) => ({ ...current, autoRotate: false })); setFocusVersion((value) => value + 1);
                }}>Find last mapped position</button>}
              </fieldset>
            </div>
          </section>
        </aside>
      </div>
    </dialog>, document.body,
  );
}
