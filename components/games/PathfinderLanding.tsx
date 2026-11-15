"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { addStars } from "@/lib/stars";
import { loadJSON, saveJSON } from "@/lib/missions";
import {
  advanceFlight, canFire, canSteer, dustFront, freshFlight, inBrakeWindow, isFlying, startBraking, switchPhase,
  STORM_ARENA, STORM_PATTERNS, STORM_SHIELDS,
  type FlightControl, type FlightPhase,
} from "./pathfinderFlight";
import type { PathfinderScene } from "./pathfinder3d";
import styles from "./PathfinderLanding.module.css";

// Game 3: Mars Pathfinder's landing on July 4, 1997, in 3D. The flight follows NASA's real entry,
// descent and landing sequence (time-compressed); the player steers the parachute toward a practice
// target and fires the retrorockets at the right moment.

const flightRecord = "https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=MPFL-M-ASIMET-2%2F3-EDR%2FRDR-EDL-V1.0";
const missionPage = "https://science.nasa.gov/mission/mars-pathfinder/";
const landedPhoto = "https://science.nasa.gov/resource/new-perspective-of-undeployed-rover/";

// cinematic titles shown as each stage begins (real altitudes from NASA's landing sequence)
const titles: Partial<Record<FlightPhase, [string, string]>> = {
  cruise: ["Seven months in space", "Pathfinder and its cruise stage near Mars"],
  approach: ["Mars approach", "The cruise stage separates before entry"],
  entry: ["Atmospheric entry", "About 130 km up · the heat shield glows"],
  chute: ["Parachute open", "About 9.4 km up · steer toward the target"],
  bridle: ["Lander on the bridle", "It drops 20 m below the backshell"],
  airbags: ["Airbags inflated", "About 355 m up · get ready to fire"],
  braking: ["Retrorockets firing", "The bridle is cut at about 21 m"],
  bounce: ["Touchdown", "Bouncing across Ares Vallis"],
};
const hints: Record<FlightPhase, string> = {
  ready: "", cruise: "Watch: Pathfinder is coasting toward Mars.", approach: "Watch: the cruise stage is about to separate.",
  entry: "Watch: the atmosphere slows Pathfinder from about 26,000 km/h.",
  chute: "Steer the white ring on the ground into the orange target. Gusts push you off course.",
  bridle: "Keep steering. Hold Shift (or Stabilize) to steady the swing.",
  airbags: "Fire the retrorockets between 125 m and 72 m.",
  braking: "", freefall: "", bounce: "", success: "", failure: "",
};
const steps: { label: string; phases: FlightPhase[] }[] = [
  { label: "Cruise", phases: ["cruise", "approach"] },
  { label: "Entry", phases: ["entry"] },
  { label: "Parachute", phases: ["chute"] },
  { label: "Bridle", phases: ["bridle"] },
  { label: "Airbags", phases: ["airbags"] },
  { label: "Rockets", phases: ["braking", "freefall"] },
  { label: "Landing", phases: ["bounce", "success", "failure"] },
];
const arrowKeys: Record<string, FlightControl> = {
  ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down", Shift: "stabilize",
};
const arrows = [
  { control: "up", symbol: "↑", label: "Steer farther" },
  { control: "left", symbol: "←", label: "Steer left" },
  { control: "down", symbol: "↓", label: "Steer nearer" },
  { control: "right", symbol: "→", label: "Steer right" },
] as const;

export default function PathfinderLanding({ stormEntry = false }: { stormEntry?: boolean }) {
  const dustPaint = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const flight = useRef(freshFlight());
  const keyboard = useRef(new Set<FlightControl>());
  const pointers = useRef(new Map<number, FlightControl>());
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading");
  const [hud, setHud] = useState(freshFlight);
  const [awarded, setAwarded] = useState(0);
  const [title, setTitle] = useState<{ key: number; text: [string, string] } | null>(null);

  function start() {
    if (load !== "ready") return;
    keyboard.current.clear();
    pointers.current.clear();
    flight.current = freshFlight();
    switchPhase(flight.current, stormEntry ? "entry" : "cruise");
    if (stormEntry) {
      flight.current.x = 0;
      flight.current.depth = 0;
    }
    setTitle(null);
    pausedRef.current = false;
    setPaused(false);
    setAwarded(0);
    setHud({ ...flight.current });
  }
  function togglePause() {
    if (!isFlying(flight.current)) return;
    pausedRef.current = !pausedRef.current;
    keyboard.current.clear();
    pointers.current.clear();
    setPaused(pausedRef.current);
  }
  function fire() {
    if (pausedRef.current) return;
    startBraking(flight.current);
    setHud({ ...flight.current });
  }

  // the 3D scene and the game loop
  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let scene: PathfinderScene | null = null;
    const el = canvas.current, box = stage.current;
    if (!el || !box) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new ResizeObserver(() => scene?.resize(box.clientWidth, box.clientHeight));
    import("./pathfinder3d").then(async ({ PathfinderScene }) => {
      if (disposed) return;
      try {
        scene = new PathfinderScene(el);
        scene.resize(box.clientWidth, box.clientHeight);
        observer.observe(box);
        await scene.ready;
      } catch {
        setLoad("error");
        return;
      }
      if (disposed) return;
      setLoad("ready");
      let previous = 0, lastHud = 0, clock = 0;
      const tick = (time: number) => {
        const sim = flight.current;
        const oldPhase = sim.phase;
        const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
        previous = time;
        const running = isFlying(sim) && !pausedRef.current;
        if (running) {
          const controls = new Set<FlightControl>([...keyboard.current, ...pointers.current.values()]);
          advanceFlight(sim, controls, dt, stormEntry);
          if (sim.phase === "success" && oldPhase !== "success") {
            const stars = sim.grade === "perfect" ? 5 : 3;
            addStars(stars);
            setAwarded(stars);
            if (!stormEntry) {
              // remember the best landing (the "Safe landing" badge reads this)
              const save = loadJSON<{ best: Record<string, number> }>("cj-landing", { best: {} });
              const dist = Math.round(Math.hypot(sim.x, sim.depth));
              save.best = { ...save.best, pathfinder: Math.min(save.best?.pathfinder ?? Infinity, dist) };
              saveJSON("cj-landing", save);
            }
          }
          if (sim.phase !== oldPhase && titles[sim.phase]) setTitle({ key: time, text: titles[sim.phase]! });
          if (time - lastHud > (stormEntry ? 32 : 80) || sim.phase !== oldPhase) { setHud({ ...sim }); lastHud = time; }
        }
        if (!pausedRef.current) clock += reduced ? 0 : dt;
        const visualFlight = stormEntry && sim.phase === "success" ? { ...sim, phase: "chute" as const }
          : stormEntry && sim.phase === "failure" ? { ...sim, phase: "entry" as const } : sim;
        const entryOffset = stormEntry && visualFlight.phase === "entry"
          ? { x: sim.x / STORM_ARENA.width, y: sim.depth / STORM_ARENA.height } : undefined;
        scene!.render(visualFlight, pausedRef.current ? 0 : dt, clock, entryOffset);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }).catch(() => !disposed && setLoad("error"));
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene?.dispose();
    };
  }, [stormEntry]);

  // keyboard
  useEffect(() => {
    const clear = () => { keyboard.current.clear(); pointers.current.clear(); };
    const down = (e: KeyboardEvent) => {
      if (!isFlying(flight.current) || pausedRef.current || e.altKey || e.ctrlKey || e.metaKey) return;
      const control = arrowKeys[e.key];
      if (control && canSteer(flight.current, stormEntry)) { e.preventDefault(); keyboard.current.add(control); }
      else if (e.code === "Space" && canFire(flight.current)) { e.preventDefault(); if (!e.repeat) fire(); }
      else if (e.key === "p" || e.key === "P") togglePause();
    };
    const up = (e: KeyboardEvent) => { const c = arrowKeys[e.key]; if (c) keyboard.current.delete(c); };
    const hidden = () => { if (document.hidden && isFlying(flight.current)) { clear(); pausedRef.current = true; setPaused(true); } };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [stormEntry]);

  const hold = (e: PointerEvent<HTMLButtonElement>, c: FlightControl) => { e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, c); };
  const release = (e: PointerEvent<HTMLButtonElement>) => { pointers.current.delete(e.pointerId); };

  const phase = hud.phase;
  const storm = stormEntry ? dustFront(hud) : null;
  const ended = phase === "success" || phase === "failure";
  const flying = isFlying(hud);
  const steering = canSteer(hud, stormEntry) && !paused;
  const rocketAvailable = canFire(hud) && !paused;
  const rocketReady = rocketAvailable && inBrakeWindow(hud.altitude);
  const distance = Math.round(Math.hypot(hud.x, hud.depth));
  const altitude = hud.altitude >= 1000 ? `${(hud.altitude / 1000).toFixed(1)} km` : `${Math.round(hud.altitude)} m`;
  const showAltitude = phase === "entry" || canSteer(hud) || phase === "braking" || phase === "freefall";
  const wind = Math.abs(hud.wind) < 0.3 ? "Calm" : `${hud.wind > 0 ? "→" : "←"} ${Math.abs(hud.wind).toFixed(1)} m/s`;
  const stepIndex = steps.findIndex((s) => s.phases.includes(phase));
  const result = stormEntry ? (phase === "success" ? "Parachute deployed!" : "Entry failed")
    : hud.grade === "perfect" ? "Perfect landing!" : hud.grade === "safe" ? "Safe landing" : "Landing failed";
  const resultText = stormEntry ? (phase === "success"
    ? "You made it past all four storms and reached parachute deployment."
    : "You faced all four storms. Avoid more dust on your next flight to reach parachute deployment.")
    : hud.grade === "unsafe" ? "The retrorockets have to fire between 125 m and 72 m, or the lander hits the ground too fast."
    : hud.grade === "missed" ? `Pathfinder came down ${distance} m from the center, outside the target.`
    : `${distance} m from the center of the target.`;

  return (
    <section className={styles.game} aria-label={stormEntry ? "Mars Dust Storm Entry game" : "Mars Pathfinder landing game"}>
      <div className={styles.stage} ref={stage}>
        <canvas ref={canvas} className={styles.canvas} role="img" aria-label="3D view of Mars Pathfinder landing at Ares Vallis" />
        {storm && (
          <svg aria-hidden="true" className={styles.dustFront} data-inside={storm.inside}
            viewBox={`${-STORM_ARENA.width / 2} ${-STORM_ARENA.height / 2} ${STORM_ARENA.width} ${STORM_ARENA.height}`}
            preserveAspectRatio="none">
            <defs><radialGradient id={dustPaint}>
              <stop stopColor="#ffcd91" stopOpacity=".9" />
              <stop offset=".58" stopColor="#c96d3f" stopOpacity=".79" />
              <stop offset="1" stopColor="#a24524" stopOpacity="0" />
            </radialGradient></defs>
            <g transform={`translate(${storm.x} ${-storm.y}) rotate(${-storm.angle})`}>
              <ellipse rx={storm.radius[0]} ry={storm.radius[1]} fill={`url(#${dustPaint})`} />
              {storm.curl !== 0 && <path className={styles.vortex} d="M -46 -15 C -20 -56 46 -40 48 -5 C 50 30 -1 48 -23 24 C -38 6 -12 -23 8 -13 C 25 -4 12 16 -1 10" />}
            </g>
          </svg>
        )}
        <div className={styles.bars} aria-hidden="true" />

        <div className={styles.top}>
          <span className={styles.mission}><b>{stormEntry ? "Dust Storm Entry" : "Mars Pathfinder"}</b>{stormEntry ? "Mars atmosphere · Arcade challenge" : "Ares Vallis · July 4, 1997"}</span>
          {flying && (
            <span className={styles.telemetry} aria-label="Flight instruments">
              {showAltitude && <span><small>Altitude</small><strong>{altitude}</strong></span>}
              {storm && <span><small>Shield</small><strong>{Math.max(0, STORM_SHIELDS - hud.stormHits)} / {STORM_SHIELDS}</strong></span>}
              {canSteer(hud) && <span><small>Wind</small><strong>{wind}</strong></span>}
              {canSteer(hud) && <span data-good={distance <= 62}><small>Off target</small><strong>{distance} m</strong></span>}
            </span>
          )}
        </div>

        {(canSteer(hud) || phase === "braking" || phase === "freefall") && (
          <svg className={styles.radar} viewBox="-130 -130 260 260" aria-label={`Target radar: ${distance} m from the center`}>
            <circle r="125" className={styles.radarBg} />
            <circle r="62" className={styles.radarSafe} />
            <circle r="17" className={styles.radarPerfect} />
            <line x1="-125" x2="125" y1="0" y2="0" /><line y1="-125" y2="125" x1="0" x2="0" />
            {(() => {
              const d = Math.hypot(hud.x, hud.depth), k = d > 118 ? 118 / d : 1;
              return <circle cx={hud.x * k} cy={-hud.depth * k} r="9" className={styles.radarCraft} />;
            })()}
          </svg>
        )}
        {title && flying && <div key={title.key} className={styles.title}><strong>{title.text[0]}</strong><span>{title.text[1]}</span></div>}
        {rocketAvailable && <div className={styles.fireCue} data-ready={rocketReady}>{rocketReady ? "Fire retrorockets now!" : "Get ready to fire…"}</div>}
        {paused && <div className={styles.pausedCue}>Paused</div>}

        {storm && (
          <div className={styles.stormLabel} aria-live="polite">
            <small>Storm {storm.wave + 1} of {STORM_PATTERNS.length}</small>
            <strong>{storm.name}</strong>
          </div>
        )}
        {flying && !stormEntry && (
          <ol className={styles.timeline} aria-label="Landing sequence">
            {steps.map((s, i) => <li key={s.label} data-state={i < stepIndex ? "done" : i === stepIndex ? "now" : "next"}>{s.label}</li>)}
          </ol>
        )}

        {phase === "ready" && (
          <div className={styles.card}>
            <span className={styles.kicker}>{stormEntry ? "Mission 04 · Arcade" : "Mission 03 · Simulator"}</span>
            <h2>{stormEntry ? "Fly through Mars entry" : "Land Mars Pathfinder"}</h2>
            {stormEntry ? <>
              <p>Use the arrow keys or on-screen controls to dodge four storms before the parachute opens. Each storm you touch costs one shield.</p>
              <ul>{STORM_PATTERNS.map(({ name }) => <li key={name}>{name}</li>)}</ul>
            </> : <>
              <p>On July 4, 1997, Pathfinder hit the top of Mars’ atmosphere at about 26,000 km/h and had to stop on the surface a few minutes later, with Sojourner folded inside. Fly the same sequence in 3D.</p>
              <ul>
                <li><b>Steer</b> the parachute with the arrow keys (or the buttons) toward the orange target.</li>
                <li><b>Fire</b> the retrorockets with Space between 125 m and 72 m.</li>
              </ul>
            </>}
            <button type="button" className={styles.primary} disabled={load !== "ready"} onClick={start}>
              {load === "loading" ? "Loading Mars…" : load === "error" ? "3D is not available on this device" : "Begin flight"}
            </button>
          </div>
        )}

        {ended && (
          <div className={styles.card} data-result={hud.grade}>
            <span className={styles.kicker}>{phase === "success" ? "Mission successful" : "Mission over"}</span>
            <h2>{result}</h2>
            <p>{resultText}</p>
            {phase === "success" && !stormEntry && (
              <figure className={styles.photo}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/story/sojourner/landed.jpg" alt="NASA photo: Pathfinder on Mars, with Sojourner still folded on its petal" />
                <figcaption>The real Pathfinder took this photo after opening its petals. Sojourner is still folded on board. · <a href={landedPhoto}>NASA/JPL</a></figcaption>
              </figure>
            )}
            {awarded > 0 && <span className={styles.stars}>+{awarded} stars</span>}
            <div className={styles.cardActions}>
              <button type="button" className={styles.primary} onClick={start}>Fly again</button>
              {stormEntry
                ? <Link className={styles.secondary} href="/games/landing">Play the full landing</Link>
                : <Link className={styles.secondary} href="/story/sojourner">Read Sojourner’s story</Link>}
            </div>
          </div>
        )}
      </div>

      <div className={styles.deck} hidden={!flying}>
        <div className={styles.pad} role="group" aria-label="Steering">
          {arrows.map(({ control, symbol, label }) => (
            <button key={control} type="button" data-dir={control} className={styles.control} disabled={!steering}
              aria-label={stormEntry ? `Steer ${control}` : label}
              onPointerDown={(e) => hold(e, control)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>{symbol}</button>
          ))}
        </div>
        {!stormEntry && <button type="button" className={styles.control} disabled={!steering}
          onPointerDown={(e) => hold(e, "stabilize")} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>Stabilize</button>}
        <p className={styles.hint}>{paused ? "Flight paused." : storm?.inside ? "Shield hit! Steer out of the dust." : storm?.hint ?? hints[phase]}</p>
        {!stormEntry && <button type="button" className={styles.fire} disabled={!rocketAvailable} data-ready={rocketReady} onClick={fire}>Fire retrorockets</button>}
        <button type="button" className={styles.control} onClick={togglePause}>{paused ? "Resume" : "Pause"}</button>
      </div>

      <details className={styles.sources}>
        <summary>How this compares with the real landing</summary>
        <p>The sequence and altitudes follow NASA’s record of the landing: entry at about 130 km, parachute at about 9.4 km, heat shield released, the lander lowered on a 20 m bridle, airbags inflated at about 355 m, three retrorockets fired at about 98 m and the bridle cut at about 21 m. Pathfinder then bounced about 15 times before rolling to a stop.</p>
        <p>{stormEntry ? "The four storm patterns and manual steering are arcade mechanics. The real Pathfinder entry and parachute deployment were automatic." : "The flight is shortened to about a minute. The real landing was automatic: steering, the orange target and the timing window are added to make it a game."} The 3D Mars uses NASA’s colour and relief maps.</p>
        <ul>
          <li><a href={missionPage}>NASA: Mars Pathfinder mission</a></li>
          <li><a href={flightRecord}>NASA Planetary Data System: the entry, descent and landing record</a></li>
          <li><Link href="/story/sojourner">The Sojourner story on this site</Link></li>
        </ul>
      </details>
    </section>
  );
}
