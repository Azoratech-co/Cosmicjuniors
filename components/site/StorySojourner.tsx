"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { PartProjection, RoverCameraControls } from "@/components/rovers/RoverScene";
import type { RoverPart } from "@/lib/rover-models";
import { sojournerModel as model } from "@/lib/sojourner-model";

// Sojourner in 3D inside the story, like the wiki's rover viewer: drag or use the arrow keys to
// turn it, + and - to zoom, Home to reset. Picking a part highlights it, slides the rover to the
// left and opens its card on the right; picking it again (or ×, or Escape) closes it.

const RoverScene = dynamic(() => import("@/components/rovers/RoverScene"), { ssr: false });
const zoomIn = 0.83;
const parts = model.partsGuide?.parts ?? [];

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function StorySojourner({ label }: { label?: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [part, setPart] = useState<RoverPart | null>(null);
  const [wide, setWide] = useState(true);
  const controls = useRef<RoverCameraControls | null>(null);
  const pending = useRef<RoverPart | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const hint = useId();
  const cardId = useId();
  const ready = status === "ready";

  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWide(el.clientWidth >= 520);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const onReady = useCallback(() => {
    if (pending.current) controls.current?.focus(pending.current);
    setStatus("ready");
  }, []);
  const onError = useCallback(() => {
    pointers.current.clear();
    setStatus("fallback");
  }, []);
  const onProject = useCallback((p: PartProjection) => void p, []);

  function choose(next: RoverPart | null) {
    if (!next || next.id === part?.id) {
      pending.current = null;
      setPart(null);
      controls.current?.clear();
      return;
    }
    pending.current = next;
    setPart(next);
    controls.current?.focus(next);
  }

  function reset() {
    pending.current = null;
    setPart(null);
    controls.current?.reset();
  }

  return (
    <div
      ref={box}
      className="ss-mars ss-model ss-rover"
      data-open={part ? "true" : "false"}
      role="group"
      aria-roledescription="3D model"
      aria-label={label ?? "Sojourner in 3D"}
      aria-describedby={hint}
      onKeyDown={(event) => {
        if (event.key === "Escape" && part) {
          choose(null);
          event.preventDefault();
        }
      }}
    >
      <div className="ss-rover__bg" style={{ backgroundImage: `url(${model.background.image})` }} aria-hidden="true" />
      {!ready && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ss-rover__poster" src={model.poster} alt={status === "fallback" ? `Rendered view of ${model.name}` : ""} />
      )}
      <div
        className="ss-rover__view"
        tabIndex={ready ? 0 : undefined}
        aria-label="Sojourner model. Arrow keys rotate, plus and minus zoom, Home resets."
        onPointerDown={(event) => {
          if (!controls.current || event.button !== 0 || pointers.current.size >= 2) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const active = pointers.current;
          const previous = active.get(event.pointerId);
          if (!previous) return;
          const next = { x: event.clientX, y: event.clientY };
          active.set(event.pointerId, next);
          const k = Math.PI / Math.max(240, event.currentTarget.clientHeight);
          if (active.size === 2) {
            const other = [...active.values()].find((p) => p !== next);
            if (!other) return;
            const before = Math.hypot(previous.x - other.x, previous.y - other.y);
            const after = Math.hypot(next.x - other.x, next.y - other.y);
            if (before > 8 && after > 8) controls.current?.zoom(before / after);
            return;
          }
          // on touch screens only sideways drags turn the rover, so up and down still scroll the story
          controls.current?.rotate((previous.x - next.x) * k, event.pointerType === "touch" ? 0 : (previous.y - next.y) * k);
        }}
        onPointerUp={(event) => { pointers.current.delete(event.pointerId); }}
        onPointerCancel={(event) => { pointers.current.delete(event.pointerId); }}
        onLostPointerCapture={(event) => { pointers.current.delete(event.pointerId); }}
        onKeyDown={(event) => {
          const c = controls.current;
          if (!c) return;
          switch (event.key) {
            case "ArrowLeft": c.rotate(-0.18, 0); break;
            case "ArrowRight": c.rotate(0.18, 0); break;
            case "ArrowUp": c.rotate(0, -0.12); break;
            case "ArrowDown": c.rotate(0, 0.12); break;
            case "+": case "=": c.zoom(zoomIn); break;
            case "-": c.zoom(1 / zoomIn); break;
            case "Home": reset(); break;
            default: return;
          }
          event.preventDefault();
        }}
      >
        {status !== "fallback" && (
          <SceneBoundary onError={onError}>
            <RoverScene model={model} controls={controls} onReady={onReady} onError={onError} highlight onProject={onProject}
              shift={part && wide && ready ? 0.22 : 0} />
          </SceneBoundary>
        )}
      </div>

      <p id={hint} className={`ss-mars__hint${part ? " is-quiet" : ""}`} role={status === "fallback" ? "status" : undefined}>
        {status === "loading" && "Loading Sojourner…"}
        {status === "fallback" && "3D is unavailable on this device, so a picture of the model is shown."}
        {ready && <>Drag or use arrow keys to rotate Sojourner.<span className="ss-mars__more"> Pick a part to learn about it.</span></>}
      </p>

      {ready && (
        <div className="ss-rover__zoom" role="group" aria-label="Rover view controls">
          <button type="button" aria-label="Zoom in" onClick={() => controls.current?.zoom(zoomIn)}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => controls.current?.zoom(1 / zoomIn)}>−</button>
          <button type="button" onClick={reset}>Reset</button>
        </div>
      )}

      {status !== "loading" && (
        <div className={`ss-mars__panel${part ? " is-open" : ""}`}>
          <div className="ss-mars__sites" role="group" aria-label="Sojourner's parts">
            {parts.map((p) => (
              <button key={p.id} type="button" className="ss-mars__site" aria-pressed={part?.id === p.id} aria-controls={cardId}
                onClick={() => choose(p)}>
                {p.name}
              </button>
            ))}
          </div>
          <section id={cardId} className="ss-mars__card" aria-live="polite" hidden={!part}>
            {part && (
              <>
                <button type="button" className="ss-mars__close" aria-label={`Close ${part.name}`} onClick={() => choose(null)}>×</button>
                <h3 style={{ color: "#f3c87a" }}>{part.name}</h3>
                <p>{part.description}</p>
                <a href={part.source} target="_blank" rel="noopener noreferrer">NASA source<span className="sr-only"> (opens in a new tab)</span></a>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
