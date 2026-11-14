"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { addStars } from "@/lib/stars";
import { MISSIONS } from "@/lib/missions";
import {
  advanceFlight, canFire, canSteer, freshFlight, inBrakeWindow, isFlying, startBraking, switchPhase,
  type FlightControl, type FlightPhase,
} from "./pathfinderFlight";
import { drawFlight, FRAME_HEIGHT, FRAME_WIDTH, loadFlightImages } from "./pathfinderArt";
import styles from "./PathfinderLanding.module.css";

const pathfinder = MISSIONS.pathfinder;
const storyUrl = "/story/sojourner";
const archive = "https://www-robotics.jpl.nasa.gov/gallery/mars-pathfinder-mission-animation-1996/";
const flightRecord = "https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=MPFL-M-ASIMET-2%2F3-EDR%2FRDR-EDL-V1.0";
const aerialPhoto = "https://science.nasa.gov/photojournal/mars-pathfinder-first-anniversary-special-refined-landing-site-location/";
const fieldPhoto = "https://science.nasa.gov/photojournal/twin-peaks/";
const roverPhoto = "https://science.nasa.gov/resource/new-perspective-of-undeployed-rover/";

const phaseLabels: Record<FlightPhase, string> = {
  ready: "Cruise", cruise: "Cruise", approach: "Mars approach", entry: "Atmospheric entry",
  chute: "Parachute descent", bridle: "Lander on bridle", airbags: "Airbags inflated",
  braking: "Retrorockets firing", freefall: "Bridle released", bounce: "Airbag touchdown",
  success: "Surface", failure: "Flight ended",
};
const phaseHints: Record<FlightPhase, string> = {
  ready: "Fly from deep space to Ares Vallis, carrying the Sojourner rover.",
  cruise: "Pathfinder is still in deep space. Watch for the first light from Mars.",
  approach: "Mars is coming into view. The cruise stage separates before entry.",
  entry: "The heat shield protects Pathfinder as the atmosphere slows it down.",
  chute: "Steer the white dot into the orange ring. Gusts will push you off course.",
  bridle: "The heat shield is gone. The lander hangs below the backshell on a tether.",
  airbags: "Fire the retrorockets when the landing button lights up.",
  braking: "The backshell rockets slow the lander before the tether is cut.",
  freefall: "The parachute and backshell separate. Airbags cushion the fall.",
  bounce: "The lander bounces and rolls before coming to rest.",
  success: "Pathfinder took this photo after opening its petals. Sojourner is still on board.",
  failure: "",
};
const arrowKeys: Record<string, FlightControl> = {
  ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", Shift: "stabilize",
};
const arrows = [
  { control: "up", symbol: "↑", label: "Fly farther" },
  { control: "left", symbol: "←", label: "Steer left" },
  { control: "down", symbol: "↓", label: "Fly nearer" },
  { control: "right", symbol: "→", label: "Steer right" },
] as const;

export default function PathfinderLanding() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const flight = useRef(freshFlight());
  const keyboard = useRef(new Set<FlightControl>());
  const pointerControls = useRef(new Map<number, FlightControl>());
  const activeControls = useRef(new Set<FlightControl>());
  const keyboardButton = useRef<{ control: FlightControl; until: number } | null>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [hud, setHud] = useState(freshFlight);
  const [awarded, setAwarded] = useState(0);

  function restart() {
    if (loadState !== "ready") return;
    keyboard.current.clear();
    pointerControls.current.clear();
    keyboardButton.current = null;
    flight.current = freshFlight();
    switchPhase(flight.current, "cruise");
    pausedRef.current = false;
    setPaused(false);
    setAwarded(0);
    setHud({ ...flight.current });
  }

  function togglePause() {
    if (!isFlying(flight.current)) return;
    pausedRef.current = !pausedRef.current;
    keyboard.current.clear();
    pointerControls.current.clear();
    keyboardButton.current = null;
    setPaused(pausedRef.current);
  }

  function fire() {
    if (pausedRef.current) return;
    startBraking(flight.current);
    setHud({ ...flight.current });
  }

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) { setLoadState("error"); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    loadFlightImages().then((images) => {
      if (disposed) return;
      setLoadState("ready");
      let previous = 0;
      let lastHud = 0;
      let drawnPhase: FlightPhase | null = null;
      function tick(time: number) {
        const sim = flight.current;
        const oldPhase = sim.phase;
        const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
        previous = time;
        if (isFlying(sim) && !pausedRef.current) {
          const controls = activeControls.current;
          controls.clear();
          for (const key of keyboard.current) controls.add(key);
          for (const control of pointerControls.current.values()) controls.add(control);
          const button = keyboardButton.current;
          if (button && time < button.until) controls.add(button.control);
          advanceFlight(sim, controls, dt);
          if (sim.phase === "success" && oldPhase !== "success") {
            const stars = sim.grade === "perfect" ? 5 : 3;
            addStars(stars);
            setAwarded(stars);
          }
          if (time - lastHud > 70 || sim.phase !== oldPhase) {
            setHud({ ...sim });
            lastHud = time;
          }
        }
        if (ctx && (drawnPhase !== sim.phase || (isFlying(sim) && !pausedRef.current))) {
          drawFlight(ctx, images, sim, reduced.matches);
          drawnPhase = sim.phase;
        }
        frame = window.requestAnimationFrame(tick);
      }
      frame = window.requestAnimationFrame(tick);
    }).catch(() => { if (!disposed) setLoadState("error"); });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
    };
  }, [loadAttempt]);

  useEffect(() => {
    function clear() { keyboard.current.clear(); pointerControls.current.clear(); keyboardButton.current = null; }
    function onKeyDown(event: KeyboardEvent) {
      if (!isFlying(flight.current) || pausedRef.current || event.altKey || event.ctrlKey || event.metaKey) return;
      const control = arrowKeys[event.key];
      if (control && canSteer(flight.current)) {
        event.preventDefault();
        keyboard.current.add(control);
      } else if (event.code === "Space" && canFire(flight.current) && (!(event.target instanceof HTMLButtonElement) || event.target.dataset.rocketAction === "true")) {
        event.preventDefault();
        if (!event.repeat) {
          startBraking(flight.current);
          setHud({ ...flight.current });
        }
      }
    }
    function onKeyUp(event: KeyboardEvent) {
      const control = arrowKeys[event.key];
      if (control) keyboard.current.delete(control);
    }
    function onVisibilityChange() {
      if (document.hidden && isFlying(flight.current)) {
        clear();
        pausedRef.current = true;
        setPaused(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  function hold(event: PointerEvent<HTMLButtonElement>, control: FlightControl) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerControls.current.set(event.pointerId, control);
  }
  function release(event: PointerEvent<HTMLButtonElement>) {
    pointerControls.current.delete(event.pointerId);
  }

  function tapControl(control: FlightControl) {
    keyboardButton.current = { control, until: performance.now() + 325 };
  }

  const ended = hud.phase === "success" || hud.phase === "failure";
  const steering = canSteer(hud) && !paused;
  const rocketAvailable = canFire(hud) && !paused;
  const rocketReady = rocketAvailable && inBrakeWindow(hud.altitude);
  const distance = Math.round(Math.hypot(hud.x, hud.depth));
  const altitude = hud.altitude >= 1000 ? `${(hud.altitude / 1000).toFixed(1)} km` : `${Math.round(hud.altitude)} m`;
  const showAltitude = hud.phase === "entry" || canSteer(hud) || ["braking", "freefall", "bounce"].includes(hud.phase);
  const result = hud.grade === "perfect" ? "Perfect landing" : hud.grade === "safe" ? "Safe landing" : "Landing unsuccessful";
  const resultText = hud.grade === "unsafe" ? "The retrorockets need to fire inside the altitude window."
    : hud.grade === "missed" ? `Pathfinder came down ${distance} m from the center, outside the target.`
    : `Mission successful · ${distance} m from the center`;
  const wind = Math.abs(hud.wind) < 0.3 ? "Calm" : `${hud.wind > 0 ? "→" : "←"} ${Math.abs(hud.wind).toFixed(1)} m/s`;

  return (
    <section className={styles.simulator} aria-label="Mars Pathfinder flight simulator">
      <div className={styles.frame}>
        <canvas ref={canvas} width={FRAME_WIDTH} height={FRAME_HEIGHT} className={styles.canvas} role="img"
          aria-label="Wide view of the Mars Pathfinder spacecraft and the simulated landing zone" />
        <div className={styles.header}>
          <span>{pathfinder.name}</span>
          <span>{pathfinder.site} · {pathfinder.year}</span>
        </div>
        {isFlying(hud) && (
          <div className={styles.telemetry} aria-label="Flight instruments">
            {showAltitude && <span><small>Altitude</small><strong>{altitude}</strong></span>}
            {canSteer(hud) && <>
              <span><small>Wind</small><strong>{wind}</strong></span>
              <span><small>Off target</small><strong>{distance} m</strong></span>
            </>}
          </div>
        )}
        {ended && <span className={styles.photoCredit}>{hud.phase === "success" ? "Surface photo · NASA/JPL" : "Simulated view"}</span>}
        <div className={styles.sceneCaption} aria-live="polite">
          <strong>{ended ? result : phaseLabels[hud.phase]}</strong>
          {ended && <span>{resultText}</span>}
        </div>
      </div>

      <div className={styles.flightDeck}>
        <div className={styles.inputPanel} hidden={ended} aria-label="Flight controls">
          <div className={styles.arrows} role="group" aria-label="Steering">
            {arrows.map(({ control, symbol, label }) => (
              <button key={control} type="button" data-direction={control} className={styles.control}
                disabled={!steering} aria-label={label}
                onPointerDown={(event) => hold(event, control)} onPointerUp={release} onPointerCancel={release}
                onLostPointerCapture={release}
                onClick={(event) => { if (event.detail === 0) tapControl(control); }}>
                {symbol}
              </button>
            ))}
          </div>
          <button type="button" className={styles.control} disabled={!steering}
            onPointerDown={(event) => hold(event, "stabilize")} onPointerUp={release} onPointerCancel={release}
            onLostPointerCapture={release}
            onClick={(event) => { if (event.detail === 0) tapControl("stabilize"); }}>Stabilize</button>
        </div>

        <div className={styles.brief}>
          <p>{paused ? "Flight paused." : phaseHints[hud.phase]}</p>
          {steering && <small>Hold the arrow controls or keyboard arrows. Hold Shift to stabilize.</small>}
          {rocketAvailable && <small>{rocketReady ? "Fire now · Space" : "Fire at 72–125 m"}</small>}
          {awarded > 0 && <span className={styles.stars}>+{awarded} stars</span>}
          {loadState === "error" && <p role="alert">The flight images could not load. Retry to start the simulator.</p>}
        </div>

        <div className={styles.actions}>
          {loadState === "error" ? <button type="button" className={styles.primary} onClick={() => { setLoadState("loading"); setLoadAttempt((value) => value + 1); }}>Retry loading</button>
            : hud.phase === "ready" || ended ? <button type="button" className={styles.primary} disabled={loadState !== "ready"} onClick={restart}>
              {loadState === "loading" ? "Loading flight…" : ended ? "Try again" : "Begin flight"}
            </button> : <>
              <button type="button" className={styles.primary} data-rocket-action="true" disabled={!rocketAvailable} data-ready={rocketReady} onClick={fire}>Fire retrorockets</button>
              <button type="button" className={styles.control} onClick={togglePause}>{paused ? "Resume" : "Pause"}</button>
            </>}
        </div>
      </div>

      <details className={styles.sources}>
        <summary>How this compares with the real landing</summary>
        <p>Pathfinder flew autonomously. Manual steering, the orange practice target, and the timing window are game mechanics. The flight is time-compressed. The orange ring on the surface photo shows the practice target.</p>
        <p>The parachute slowed the aeroshell before the heat shield dropped. After the lander lowered on its bridle, airbags inflated, three retrorockets fired, and the bridle was cut. The parachute and backshell separated from the airbag-protected lander. Sojourner stayed stowed until after the petals opened.</p>
        <ul>
          <li><a href={storyUrl}>The Sojourner storyline</a></li>
          <li><a href={flightRecord}>NASA Planetary Data System flight sequence</a></li>
          <li><a href={archive}>1996 JPL animation</a> · spacecraft, parachute and airbag frame cutouts, NASA/JPL-Caltech</li>
          <li><a href={aerialPhoto}>Mars Global Surveyor view of Ares Vallis</a> ? existing storyline orbital image, tinted in the simulator</li>
          <li><a href={fieldPhoto}>Pathfinder’s Twin Peaks photograph</a> and <a href={roverPhoto}>Sojourner on its lander petal</a> · existing Sojourner storyline, NASA/JPL</li>
          <li><a href="https://science.nasa.gov/photojournal/global-color-views-of-mars/">Viking Mars mosaics</a> · existing storyline Mars image, NASA/JPL/USGS</li>
        </ul>
      </details>
    </section>
  );
}
