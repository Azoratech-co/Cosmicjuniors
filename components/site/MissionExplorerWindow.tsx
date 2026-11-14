"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { Component, useCallback, useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { Group } from "three";
import styles from "./MissionExplorerWindow.module.css";
import type { LandingGlobeData, LandingSite } from "@/lib/mission-landing-sites";
import { initialGlobeView, surfaceReferences, type SurfaceStatus } from "@/lib/globe-surface";

const Scene = dynamic(() => import("./MissionGlobeScene"), { ssr: false });
const initialCamera = initialGlobeView;

class WindowBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

type Props = { data: LandingGlobeData; site: LandingSite; onSelect: (site: LandingSite) => void; onClose: () => void };

export default function MissionExplorerWindow({ data, site, onSelect, onClose }: Props) {
  const world = data.world;
  const planet = world === "moon" ? "Moon" : "Mars";
  const sources = surfaceReferences[world];
  const dialog = useRef<HTMLDialogElement>(null);
  const globe = useRef<Group | null>(null);
  const redraw = useRef<(() => void) | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [camera, setCamera] = useState(initialCamera);
  const [surfaceStatus, setSurfaceStatus] = useState<SurfaceStatus>("loading");
  const [detailAttempt, setDetailAttempt] = useState(0);
  const onDetailStatus = useCallback((next: SurfaceStatus) => setSurfaceStatus(next), []);
  const [focusVersion, setFocusVersion] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const title = useId();
  const hint = useId();
  const onReady = useCallback(() => setStatus("ready"), []);
  const onError = useCallback(() => { pointers.current.clear(); setStatus("failed"); }, []);

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    if (window.matchMedia("(max-width: 640px)").matches) setPanelOpen(false);
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function close() {
    if (closing) return;
    const finish = () => { dialog.current?.close(); onClose(); };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    setClosing(true);
    closeTimer.current = setTimeout(finish, 200);
  }

  function findSite() {
    setCamera((current) => ({ ...current, autoRotate: false }));
    setFocusVersion((value) => value + 1);
  }

  function zoom(factor: number) {
    setCamera((current) => ({ ...current, zoom: Math.max(0.7, Math.min(2.6, current.zoom * factor)) }));
  }

  function rotate(x: number, y: number) {
    if (!globe.current) return;
    globe.current.rotation.y += x;
    globe.current.rotation.x = Math.max(-1.45, Math.min(1.45, globe.current.rotation.x + y));
    redraw.current?.();
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (status !== "ready" || event.button !== 0 || pointers.current.size >= 2) return;
    setCamera((current) => current.autoRotate ? { ...current, autoRotate: false } : current);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);
    if (pointers.current.size === 2) {
      const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)?.[1];
      if (!other) return;
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      if (before > 8 && after > 8) zoom(after / before);
    } else rotate((next.x - previous.x) * 0.007, (next.y - previous.y) * 0.007);
  }

  // Wheel handling stays inside the modal globe and leaves browser Ctrl+wheel zoom alone.
  const viewport = useRef<HTMLDivElement>(null);
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
      <div className={styles.window}>
        <header className={styles.titlebar}>
          <span className={styles.planetIcon} data-world={world} aria-hidden="true" />
          <div><h2 id={title}>{planet} explorer</h2><p>{world === "moon" ? "A closer look at the lunar surface" : "A closer look at the Red Planet"}</p></div>
          <button type="button" className={styles.close} aria-label={`Close ${planet} explorer`} onClick={close} autoFocus>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
          </button>
        </header>

        <div className={styles.space}>
          <div ref={viewport} className={styles.viewport} role="group" aria-label={`Expanded ${planet} globe`} aria-describedby={hint}
            tabIndex={status === "ready" ? 0 : undefined} onPointerDown={pointerDown} onPointerMove={pointerMove}
            onPointerUp={(event) => pointers.current.delete(event.pointerId)}
            onPointerCancel={(event) => pointers.current.delete(event.pointerId)}
            onLostPointerCapture={(event) => pointers.current.delete(event.pointerId)}
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
              <Scene data={data} site={site} focusVersion={focusVersion} globe={globe} redraw={redraw}
                onReady={onReady} onError={onError} view={camera} onDetailStatus={onDetailStatus} detailAttempt={detailAttempt} />
            </WindowBoundary>}
          </div>
          {status !== "ready" && <p className={styles.notice} role="status">{status === "loading" ? `Loading ${planet}…` : "The 3D globe is unavailable. Landing sites and NASA references remain available in the page below."}</p>}


          <aside className={styles.cameraPanel} aria-label="Camera controls">
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

              </fieldset>
            </div>
          </aside>
          <div className={styles.surfaceCredits}>
            <span role="status">{surfaceStatus === "ready" ? "Detailed NASA surface" : surfaceStatus === "failed" ? "Standard surface" : "Loading surface detail…"}</span>
            {surfaceStatus === "failed" && <button type="button" onClick={() => setDetailAttempt((value) => value + 1)}>Retry detail</button>}
            <a href={sources.color} target="_blank" rel="noopener noreferrer">NASA imagery</a>
            <a href={sources.elevation} target="_blank" rel="noopener noreferrer">Terrain source</a>
          </div>
          <p id={hint} className={styles.hint}>Drag to rotate · Scroll or pinch to zoom<br /><span>○ Landing site · Terrain from NASA measurements</span></p>
        </div>

        <footer className={styles.footer}>
          <label>Landing site
            <select value={String(data.sites.indexOf(site))} onChange={(event) => {
              const next = data.sites[Number(event.target.value)];
              if (next) onSelect(next);
              findSite();
            }}>{data.sites.map((entry, index) => <option key={entry.name} value={index}>{entry.label ?? entry.name}</option>)}</select>
          </label>
          <div className={styles.siteInfo}><span style={{ background: site.color }} aria-hidden="true" /><div><strong>{site.region}</strong><p>{site.coordinates} · Landing site, not current position</p></div></div>
          <button type="button" className={styles.find} disabled={status !== "ready"} onClick={findSite}>Find site</button>
        </footer>
      </div>
    </dialog>, document.body,
  );
}
