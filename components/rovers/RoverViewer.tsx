"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { RoverModel, RoverPart } from "@/lib/rover-models";
import type { PartProjection, RoverCameraControls } from "./RoverScene";
import RoverPartsPicker from "./RoverPartsPicker";
import styles from "./RoverViewer.module.css";

const RoverScene = dynamic(() => import("./RoverScene"), { ssr: false });
const zoomIn = 0.83;

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function RoverViewer({ model }: { model: RoverModel }) {
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [part, setPart] = useState<RoverPart | null>(null);
  const [highlight, setHighlight] = useState(true);
  const [layout, setLayout] = useState<"v1" | "v2">("v2");
  const [projection, setProjection] = useState<PartProjection | null>(null);
  const onProject = useCallback((next: PartProjection) => {
    setProjection((previous) => !next.visible && previous && !previous.visible ? previous :
      next.visible || !previous ? next : { ...previous, visible: false });
  }, []);
  const description = useId();
  const controls = useRef<RoverCameraControls | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pendingPart = useRef<RoverPart | null>(null);
  const onReady = useCallback(() => {
    if (pendingPart.current) controls.current?.focus(pendingPart.current);
    setStatus("ready");
  }, []);
  const onError = useCallback(() => {
    pointers.current.clear();
    setStatus("fallback");
  }, []);
  const ready = status === "ready";

  useEffect(() => {
    const element = viewport.current;
    if (!element || !ready) return;

    function zoomWithWheel(event: WheelEvent) {
      if (event.ctrlKey || !controls.current || !event.deltaY) return;
      if (event.target instanceof Element && event.target.closest(`.${styles.partInfo}`)) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 240 : 1;
      const delta = Math.max(-240, Math.min(240, event.deltaY * unit));
      controls.current.zoom(Math.exp(delta * 0.0015));
    }

    element.addEventListener("wheel", zoomWithWheel, { passive: false });
    return () => element.removeEventListener("wheel", zoomWithWheel);
  }, [ready]);

  function selectPart(next: RoverPart) {
    pendingPart.current = next;
    setPart(next);
    controls.current?.focus(next);
  }

  function resetView() {
    pendingPart.current = null;
    setPart(null);
    controls.current?.reset();
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!controls.current || event.button !== 0 || pointers.current.size >= 2) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const active = pointers.current;
    const previous = active.get(event.pointerId);
    if (!previous) return;

    const next = { x: event.clientX, y: event.clientY };
    active.set(event.pointerId, next);
    const sensitivity = Math.PI / Math.max(240, event.currentTarget.clientHeight);

    if (active.size === 2) {
      const other = [...active.values()].find((point) => point !== next);
      if (!other) return;
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      if (before > 8 && after > 8) controls.current?.zoom(before / after);
      controls.current?.rotate(0, (previous.y - next.y) * sensitivity / 2);
      return;
    }

    controls.current?.rotate(
      (previous.x - next.x) * sensitivity,
      event.pointerType === "touch" ? 0 : (previous.y - next.y) * sensitivity,
    );
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const camera = controls.current;
    if (!camera) return;
    switch (event.key) {
      case "ArrowLeft": camera.rotate(-0.18, 0); break;
      case "ArrowRight": camera.rotate(0.18, 0); break;
      case "ArrowUp": camera.rotate(0, -0.12); break;
      case "ArrowDown": camera.rotate(0, 0.12); break;
      case "+": case "=": camera.zoom(zoomIn); break;
      case "-": camera.zoom(1 / zoomIn); break;
      case "Home": resetView(); break;
      default: return;
    }
    event.preventDefault();
  }

  const anchor = ready && projection?.visible ? projection : null;
  const [typedPart, setTypedPart] = useState<string | null>(null);
  const revealPart = anchor || status === "fallback" ? part : null;
  useEffect(() => {
    if (!revealPart) {
      setTypedPart(null);
      return;
    }
    const timer = window.setTimeout(() => setTypedPart(revealPart.id), revealPart.description.length * 5 + 30);
    return () => window.clearTimeout(timer);
  }, [revealPart]);
  const stageWidth = viewport.current?.clientWidth ?? 0;
  const stageHeight = viewport.current?.clientHeight ?? 0;
  const sideBySide = !!projection && stageWidth - projection.width > (layout === "v1" ? 100 : 240);
  const showLeft = layout === "v2" && sideBySide && projection.x < projection.width / 2;
  const gap = Math.min(30, Math.max(13, 19 * (projection?.zoom ?? 1)));
  const canvasLeft = layout === "v2" && projection ? (stageWidth - projection.width) / 2 : 0;
  const anchorX = (projection?.x ?? 0) + canvasLeft;
  const sideSpace = layout === "v1" ? stageWidth - (projection?.width ?? 0) : canvasLeft;
  const popupWidth = sideBySide ? Math.min(215, sideSpace - gap - 8) : Math.min(340, stageWidth - 20);
  const left = sideBySide ? (showLeft ? canvasLeft - gap - popupWidth : canvasLeft + projection.width + gap) : (stageWidth - popupWidth) / 2;
  const popupY = sideBySide
    ? Math.max(56, Math.min(stageHeight - 150, projection.y - 30))
    : (projection?.height ?? 0) + gap;

  return (
    <section className={styles.viewer} data-guide={!!model.partsGuide} data-layout={layout} aria-label={`${model.name} rover viewer`}>
      <div className={styles.stage}>
      <div className={styles.background} style={{ backgroundImage: `url(${model.background.image})` }} />
      <div
        className={styles.viewport}
        ref={viewport}
        role="group"
        aria-label={`Interactive view of ${model.name}`}
        aria-describedby={description}
        tabIndex={ready ? 0 : undefined}
        data-ready={ready}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={onKeyDown}
      >
        {!ready && (
          // The same static poster covers loading and provides a preview if WebGL fails.
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.poster} src={model.poster} alt={`Rendered view of ${model.name}`} />
        )}
        {status !== "fallback" && (
          <SceneBoundary onError={onError}>
            <div className={styles.canvasArea}>
              <RoverScene model={model} controls={controls} onReady={onReady} onError={onError} highlight={highlight} onProject={onProject} centered={layout === "v2"} />
            </div>
          </SceneBoundary>
        )}
        {part && projection && (
          <svg className={styles.leader} data-visible={!!anchor} aria-hidden="true">
            <line x1={anchorX} y1={projection.y} x2={sideBySide ? (showLeft ? left + popupWidth : left) : Math.max(left + 5, Math.min(left + popupWidth - 5, anchorX))} y2={popupY + (sideBySide ? 20 : 0)} />
            <circle cx={anchorX} cy={projection.y} r="4" />
          </svg>
        )}
        {part && (
          <div
            className={styles.partInfo}
            data-visible={!!anchor || status === "fallback"}
            data-static={status === "fallback"}
            style={status === "fallback" ? undefined : { left, top: popupY, width: popupWidth, maxHeight: stageHeight - popupY - 4 }}
            inert={!anchor && status !== "fallback"}
            aria-live="polite"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <strong>{part.name}</strong>
            <p>
              <span className={styles.visuallyHidden}>{part.description}</span>
              <span key={part.id} aria-hidden="true">
                {typedPart === part.id ? part.description : part.description.split(" ").map((word, index, words) => (
                  <span key={index} className={styles.typedWord}>
                    {Array.from(word, (letter, letterIndex) => (
                      <span key={letterIndex} style={{ "--letter-delay": `${5 * (words.slice(0, index).join(" ").length + index + letterIndex)}ms` } as CSSProperties}>{letter}</span>
                    ))}
                    {index < words.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>{" "}
              <a href={part.source} target="_blank" rel="noreferrer">NASA source</a>
            </p>
          </div>
        )}
      </div>
      <p id={description} className={styles.visuallyHidden}>
        {model.description} Use the arrow keys to rotate, plus and minus to zoom, and Home to reset.
      </p>
      <div className={styles.footer}>
        <div className={styles.actions}>
          <div className={styles.controls} role="group" aria-label="Rover view controls">
            <button type="button" aria-label="Zoom in" disabled={!ready} onClick={() => controls.current?.zoom(zoomIn)}>+</button>
            <button type="button" aria-label="Zoom out" disabled={!ready} onClick={() => controls.current?.zoom(1 / zoomIn)}>−</button>
            <button type="button" disabled={!ready} onClick={resetView}>Reset view</button>
          </div>
          <span className={styles.hint} role="status">
            {status === "loading" && "Loading 3D rover…"}
            {status === "fallback" && "3D unavailable · showing a static preview"}
            {ready && !model.partsGuide && "Drag to rotate"}
          </span>
        </div>
        <div className={styles.credits}>
          <a href={model.modelCredit.url} target="_blank" rel="noreferrer">{model.modelCredit.label}</a>
          {model.modelCredit.license && (
            <a href={model.modelCredit.license.url} target="_blank" rel="noreferrer">{model.modelCredit.license.label}</a>
          )}
          <a href={model.background.url} target="_blank" rel="noreferrer">{model.background.credit}</a>
        </div>
      </div>
      </div>
      {model.partsGuide && (
        <div className={styles.layoutSwitch} role="group" aria-label="Compare viewer layouts">
          <button type="button" aria-pressed={layout === "v1"} onClick={() => setLayout("v1")}>V1</button>
          <button type="button" aria-pressed={layout === "v2"} onClick={() => setLayout("v2")}>V2</button>
        </div>
      )}
      {model.partsGuide && (
        <RoverPartsPicker
          guide={model.partsGuide}
          selected={part?.id}
          onSelect={selectPart}
          highlight={highlight}
          onHighlight={() => setHighlight((enabled) => !enabled)}
          highlightAvailable={ready}
        />
      )}
    </section>
  );
}
