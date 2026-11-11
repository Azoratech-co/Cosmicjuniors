"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WinPanel } from "./GameShell";
import { Chevron } from "./Chevron";
import { addStars } from "@/lib/stars";
import { MISSIONS, loadJSON, saveJSON, type Mission } from "@/lib/missions";
import { flame, loadImage } from "./art";

// Mars Landing: the real entry, descent and landing sequence at five NASA landing sites.
// 1. Entry: the capsule hits the thin Martian air behind its heat shield. Steer toward the landing site.
// 2. Parachute: open it inside the safe speed window. The heat shield then drops away.
// 3. Landing, the way each real mission did it:
//    - airbags (Pathfinder, Spirit): fire the rockets just above the ground, then bounce to a stop
//    - landing engines (Viking 1, InSight): cut the parachute and fly the lander down gently
//    - sky crane (Perseverance): fly the descent stage down and lower the rover on cables
// 4. Science: drive the rover to a rock, or scoop soil / place the seismometer.

const W = 960;
const H = 540;
const GROUND = 498; // screen y of the surface
const MARS_G = 3.71; // Mars gravity, m/s²
const ENTRY_T = 9.5;
const CHUTE_EARLY = 520; // m/s: faster than this and the parachute tears
const CHUTE_LATE = 330;
const FINAL_ALT = 800; // m: the camera zooms from here to the ground
const SAVE_KEY = "cj-landing";

type Method = "airbags" | "engines" | "skycrane";
type Task = "drive" | "scoop" | "seismo";

interface Site {
  mission: Mission;
  method: Method;
  zone: number; // half-width of the safe landing zone, m
  rocks: [number, number][]; // [x m, radius m] boulders
  sand: [number, number][]; // soft soil, m right of the lander
  wind: number; // m/s
  gusty: boolean;
  start: number; // how far off course entry begins, km
  task: Task;
  rover?: string;
  window?: number;
}

const SITES: Site[] = [
  { mission: MISSIONS.viking1, method: "engines", zone: 45, rocks: [[-32, 1.1], [22, 0.8], [58, 1.3], [-70, 1.5]], sand: [], wind: 2, gusty: false, start: 2, task: "scoop", window: 0.18 },
  { mission: MISSIONS.pathfinder, method: "airbags", zone: 80, rocks: [[-20, 0.9], [9, 0.6], [30, 1.2], [-48, 1.4], [55, 0.8], [26.5, 0.5], [34, 0.7]], sand: [[7, 10]], wind: 3, gusty: false, start: 2.5, task: "drive", rover: "Sojourner" },
  { mission: MISSIONS.spirit, method: "airbags", zone: 70, rocks: [[-25, 1.2], [14, 0.7], [40, 1.1], [-55, 1.6], [26, 0.6], [33, 0.5]], sand: [[4, 8], [11, 14]], wind: 4, gusty: false, start: 3, task: "drive", rover: "Spirit" },
  { mission: MISSIONS.insight, method: "engines", zone: 35, rocks: [[-28, 0.6], [44, 0.7]], sand: [], wind: 4, gusty: true, start: 3, task: "seismo", window: 0.11 },
  { mission: MISSIONS.perseverance, method: "skycrane", zone: 30, rocks: [[-14, 1.2], [19, 1.0], [-35, 1.6], [42, 1.4], [8, 0.5], [26, 0.6], [33, 0.7]], sand: [[5, 8], [12, 15]], wind: 3, gusty: true, start: 3.5, task: "drive", rover: "Perseverance" },
];

const METHOD_TEXT: Record<Method, string> = {
  airbags: "fire the rockets just above the ground so the airbags can bounce it to a stop",
  engines: "cut the parachute away and fly it down on its landing engines",
  skycrane: "fly the descent stage down and lower the rover on cables: the sky crane",
};
const TASK_TEXT: Record<Task, (s: Site) => string> = {
  drive: (s) => `drive ${s.rover} to the target rock before its battery runs out`,
  scoop: () => "scoop a soil sample for the biology lab",
  seismo: () => "place the seismometer on the ground",
};

type Phase = "ready" | "entry" | "chute" | "final" | "bounce" | "crane" | "science" | "done" | "crashed" | "scifail";
type Crash = "tore" | "late" | "fast" | "rock" | "burst" | "off" | "fuel";
interface Save { unlocked: number; best: Record<string, number> }
const EMPTY_SAVE: Save = { unlocked: 0, best: {} };

const LOG_TOP = Math.log(1 + FINAL_ALT / 4);
const S = 1.7; // drawing scale for the spacecraft and rovers
/** Camera: how high the lander sits above the ground on screen, and pixels per meter at that altitude. */
const lift = (alt: number) => 340 * Math.min(1, Math.log(1 + Math.max(0, alt) / 4) / LOG_TOP);
const pxPerM = (alt: number) => 340 / ((4 + Math.min(FINAL_ALT, Math.max(0, alt))) * LOG_TOP);

function newSim(site: Site) {
  const side = Math.random() < 0.5 ? -1 : 1;
  return {
    site, t: 0,
    speed: 5400, altKm: 125, xKm: side * site.start, vxKm: -side * 0.05, chuteAt: 0,
    alt: 11000, x: 0, vx: 0, vy: -60, fuel: 100, wind: 0, gust: 2,
    chute: 0, shieldDrop: -1, cutAt: 0, rocketsAt: -1, bagH: 0, cable: 0, craneT: 0, flyAway: 0,
    ball: { x: 0, y: 0, vx: 0, vy: 0, bounces: 0, rest: 0 }, open: 0,
    rover: { x: 0, v: 0, battery: 100, analyze: 0, out: 0 },
    target: 0, needle: 0, tries: 3, hitFlash: 0, missFlash: 0,
    dust: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    keys: new Set<string>(), pad: 0, thrust: false, burning: false, wreck: false,
  };
}
type Sim = ReturnType<typeof newSim>;

export default function MarsLanding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [siteIdx, setSiteIdx] = useState(0);
  const site = SITES[siteIdx];
  const [save, setSave] = useState<Save>(EMPTY_SAVE);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hud, setHud] = useState({ alt: 0, altKm: 125, speed: 5400, vy: 0, fuel: 100, wind: 0, battery: 100, dist: 0, analyze: 0, tries: 3, chute: false, cut: false, fired: false });
  const [result, setResult] = useState({ landStars: 0, sciStars: 0, distance: 0, speed: 0, crash: "fast" as Crash });

  const sim = useRef<Sim>(newSim(SITES[0]));
  const phaseRef = useRef<Phase>("ready");
  phaseRef.current = phase;
  const go = (p: Phase) => {
    phaseRef.current = p;
    sim.current.t = 0;
    setPhase(p);
  };
  const marsImg = useRef<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    setSave(loadJSON(SAVE_KEY, EMPTY_SAVE));
    marsImg.current = loadImage("/games/mars.webp");
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __landing: unknown }).__landing = sim;
  }, []);

  const reset = useCallback((idx: number) => {
    const keys = sim.current.keys;
    sim.current = newSim(SITES[idx]);
    sim.current.keys = keys;
    setHud((h) => ({ ...h, alt: 0, altKm: 125, speed: 5400, vy: 0, fuel: 100, chute: false, cut: false, fired: false }));
  }, []);

  useEffect(() => reset(0), [reset]);

  const pickSite = (i: number) => {
    setSiteIdx(i);
    reset(i);
    go("ready");
  };

  const crash = (c: Crash, extra: Partial<typeof result> = {}) => {
    sim.current.wreck = c !== "off";
    setResult({ landStars: 0, sciStars: 0, distance: 0, speed: 0, ...extra, crash: c });
    go("crashed");
  };
  const crashRef = useRef(crash);
  crashRef.current = crash;

  /** Safe on the ground: score the landing, then start the science. */
  const touchdown = (x: number, speed: number) => {
    const s = sim.current;
    const distance = Math.round(Math.abs(x));
    if (distance > s.site.zone) {
      addStars(1);
      setResult({ landStars: 1, sciStars: 0, distance, speed, crash: "off" });
      go("crashed");
      return;
    }
    const landStars = 3 + (distance <= s.site.zone * 0.3 ? 2 : 0);
    addStars(landStars);
    setResult({ landStars, sciStars: 0, distance, speed, crash: "fast" });
    s.x = x;
    s.rover = { x: x + 1.5, v: 0, battery: 100, analyze: 0, out: 0 };
    s.target = x + 18;
    s.tries = 3;
    s.needle = 0;
    go("science");
  };
  const touchRef = useRef(touchdown);
  touchRef.current = touchdown;

  const finishScience = (ok: boolean) => {
    if (phaseRef.current !== "science") return;
    if (!ok) return go("scifail");
    const sciStars = 3;
    addStars(sciStars);
    setResult((r) => {
      const total = r.landStars + sciStars;
      setSave((sv) => {
        const id = sim.current.site.mission.id;
        const idx = SITES.findIndex((x) => x.mission.id === id);
        const next = { unlocked: Math.max(sv.unlocked, Math.min(SITES.length - 1, idx + 1)), best: { ...sv.best, [id]: Math.max(sv.best[id] ?? 0, total) } };
        saveJSON(SAVE_KEY, next);
        return next;
      });
      return { ...r, sciStars };
    });
    go("done");
  };
  const finishRef = useRef(finishScience);
  finishRef.current = finishScience;

  const tryTiming = () => {
    const s = sim.current;
    const pos = 0.5 + 0.5 * Math.sin(s.needle);
    if (Math.abs(pos - 0.5) < (s.site.window ?? 0.15) / 2) {
      s.hitFlash = 1;
      finishScience(true);
    } else {
      s.tries -= 1;
      s.missFlash = 0.5;
      setHud((h) => ({ ...h, tries: s.tries }));
      if (s.tries <= 0) finishScience(false);
    }
  };

  /** The one big button (also Space): what it does depends on the moment. */
  const action = useCallback(() => {
    const s = sim.current;
    const p = phaseRef.current;
    if (p === "ready" || p === "crashed") {
      reset(SITES.indexOf(s.site));
      go("entry");
    } else if (p === "entry") {
      if (s.speed > 1200) return; // far too early: ignore stray taps
      if (s.speed > CHUTE_EARLY) crashRef.current("tore", { speed: Math.round(s.speed) });
      else {
        s.chuteAt = s.speed;
        s.x = s.xKm * 25; // km off course at entry becomes meters off at the bottom
        s.alt = 11000;
        s.vy = -s.speed * 0.25;
        s.chute = 0.01;
        go("chute");
      }
    } else if (p === "final" && s.site.method === "airbags" && s.rocketsAt < 0) {
      s.rocketsAt = s.alt;
    } else if (p === "final" && s.site.method !== "airbags" && !s.cutAt) {
      s.cutAt = s.alt;
    } else if (p === "science" && s.site.task !== "drive") {
      tryTiming();
    } else if (p === "scifail") {
      s.rover = { x: s.x + 1.5, v: 0, battery: 100, analyze: 0, out: 0 };
      s.tries = 3;
      go("science");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  const flying = () => {
    const s = sim.current;
    return (phaseRef.current === "final" || phaseRef.current === "crane") && s.site.method !== "airbags" && s.cutAt > 0;
  };

  useEffect(() => {
    const keys = sim.current.keys;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ([" ", "enter", "arrowleft", "arrowright", "arrowdown", "arrowup"].includes(k)) e.preventDefault();
      if ((k === " " || k === "enter") && flying()) sim.current.thrust = true;
      else if (k === " " || k === "enter") { if (!e.repeat) action(); }
      else sim.current.keys.add(k);
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "enter") sim.current.thrust = false;
      sim.current.keys.delete(k);
      keys.delete(k);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0;
    let last = performance.now();
    let uiTick = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = sim.current;
      const st = s.site;
      const p = phaseRef.current;
      s.t += dt;

      let steer = s.pad;
      if (s.keys.has("arrowleft") || s.keys.has("a")) steer -= 1;
      if (s.keys.has("arrowright") || s.keys.has("d")) steer += 1;
      steer = Math.max(-1, Math.min(1, steer));
      const thrust = s.thrust || s.keys.has("arrowup") || s.keys.has("w");

      // wind (gusty sites change it every couple of seconds)
      s.gust -= dt;
      if (s.gust <= 0) {
        s.gust = st.gusty ? 2 + Math.random() : 4;
        s.wind = (Math.random() * 2 - 1) * st.wind;
      }

      if (p === "entry") {
        const k = Math.min(1, s.t / ENTRY_T);
        s.speed = 280 + 5120 * Math.pow(Math.max(0, 1 - s.t / ENTRY_T), 2.2);
        s.altKm = 11 + 114 * Math.pow(1 - k, 1.5);
        s.vxKm += (steer * 0.55 + (Math.random() - 0.5) * 0.2) * dt;
        s.vxKm *= 1 - 0.5 * dt;
        s.xKm += s.vxKm * dt;
        if (s.speed < CHUTE_LATE) crashRef.current("late");
      } else if (p === "chute") {
        // time-lapse from 11 km down to the final approach under the parachute
        s.chute = Math.min(1, s.chute + dt * 2);
        s.alt = Math.max(FINAL_ALT, s.alt - dt * 2600);
        s.vy += (-62 - s.vy) * Math.min(1, dt * 1.5);
        s.x += s.wind * dt * 4;
        if (s.t > 1 && s.shieldDrop < 0) s.shieldDrop = 0;
        if (s.alt <= FINAL_ALT) go("final");
      } else if (p === "final" || p === "crane") {
        stepFinal(s, dt, steer, thrust, (c, extra) => crashRef.current(c, extra), (x, v) => touchRef.current(x, v), () => go("bounce"), () => go("crane"));
      } else if (p === "bounce") {
        stepBounce(s, dt, (c, extra) => crashRef.current(c, extra), (x, v) => touchRef.current(x, v));
      } else if (p === "science") {
        if (st.task === "drive") {
          const R = s.rover;
          R.out = Math.min(1, R.out + dt * 0.8);
          const inSand = st.sand.some(([a, b]) => R.x >= s.x + a && R.x <= s.x + b);
          const max = inSand ? 1.6 : 4;
          if (R.out >= 1 && steer && R.battery > 0) {
            R.v += steer * 6 * dt;
            R.battery = Math.max(0, R.battery - (inSand ? 15 : 6.5) * dt);
          } else R.v -= R.v * Math.min(1, 4 * dt);
          R.v = Math.max(-max * 0.6, Math.min(max, R.v));
          R.x = Math.max(s.x + 1.5, R.x + R.v * dt);
          R.battery = Math.max(0, R.battery - 1.1 * dt);
          const atTarget = Math.abs(R.x - (s.target - 1.2)) < 0.9 && Math.abs(R.v) < 0.4;
          R.analyze = atTarget ? R.analyze + dt / 1.6 : Math.max(0, R.analyze - dt);
          if (R.analyze >= 1) finishRef.current(true);
          else if (R.battery <= 0 && !atTarget) finishRef.current(false);
        } else {
          s.needle += dt * (st.task === "seismo" ? 3.6 : 2.6);
        }
      }
      if (s.flyAway > 0) s.flyAway += dt;
      if (s.open > 0 && s.open < 1) s.open = Math.min(1, s.open + dt * 1.2);
      s.hitFlash = Math.max(0, s.hitFlash - dt);
      s.missFlash = Math.max(0, s.missFlash - dt);
      for (const d of s.dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy -= 0.4 * dt; d.life += dt; }
      s.dust = s.dust.filter((d) => d.life < 2.5);

      uiTick += dt;
      if (uiTick > 0.08) {
        uiTick = 0;
        setHud({
          alt: Math.max(0, Math.round(s.alt)), altKm: Math.round(s.altKm), speed: Math.round(s.speed), vy: Math.round(-s.vy * 10) / 10,
          fuel: Math.round(s.fuel), wind: s.wind, battery: Math.round(s.rover.battery),
          dist: Math.max(0, Math.round((s.target - 1.2 - s.rover.x) * 10) / 10), analyze: s.rover.analyze, tries: s.tries,
          chute: s.chute > 0, cut: s.cutAt > 0, fired: s.rocketsAt >= 0,
        });
      }

      draw(ctx, s, p, now, marsImg.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const hold = (dir: number) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); sim.current.pad = dir; },
    onPointerUp: () => { sim.current.pad = 0; },
    onPointerLeave: () => { sim.current.pad = 0; },
    onPointerCancel: () => { sim.current.pad = 0; },
  });

  const drive = phase === "science" && site.task === "drive";
  const timing = phase === "science" && site.task !== "drive";
  const engines = (phase === "final" || phase === "crane") && site.method !== "airbags" && hud.cut;
  const actionLabel =
    phase === "ready" ? "Start entry"
      : phase === "entry" ? (hud.speed > CHUTE_EARLY ? "Parachute: wait for the window" : "Open parachute!")
      : phase === "chute" ? "Parachute open"
      : phase === "final" && site.method === "airbags" ? (hud.fired ? "Rockets firing" : "Fire rockets + airbags")
      : phase === "final" && !hud.cut ? "Cut parachute, start engines"
      : engines ? "Hold to fire engines"
      : phase === "bounce" ? "Bouncing…"
      : timing ? (site.task === "scoop" ? "Scoop!" : "Place it!")
      : drive ? (hud.analyze > 0 ? "Analyzing rock…" : "Stop on the target rock")
      : phase === "scifail" ? "Try the science again"
      : phase === "done" ? "Mission complete" : "Try again";
  const steerOn = phase === "entry" || engines || drive;
  const hasNext = siteIdx < SITES.length - 1;
  const busy = !["ready", "crashed", "done", "scifail"].includes(phase);

  const thrustHold = engines
    ? {
        onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); sim.current.thrust = true; },
        onPointerUp: () => { sim.current.thrust = false; },
        onPointerLeave: () => { sim.current.thrust = false; },
        onPointerCancel: () => { sim.current.thrust = false; },
      }
    : { onClick: action };

  return (
    <div className="arcade landing">
      <div className="mission-picker" role="group" aria-label="Choose a landing mission">
        {SITES.map((s, i) => {
          const locked = i > save.unlocked;
          const best = save.best[s.mission.id];
          return (
            <button key={s.mission.id} className={`mission-chip${i === siteIdx ? " is-on" : ""}`} disabled={locked || busy} onClick={() => pickSite(i)}
              aria-label={`${s.mission.name}, ${s.mission.site}, ${s.mission.year}${locked ? ", locked" : ""}`}>
              <span className="t-caption c-cyan">{s.mission.year}{locked ? " · Locked" : best ? ` · ★ ${best}` : ""}</span>
              <span className="t-label">{s.mission.name}</span>
              <span className="t-caption c-muted">{s.mission.site}</span>
            </button>
          );
        })}
      </div>

      <div className="arcade-hud">
        {drive ? (
          <>
            <span className="t-label">{site.rover} battery <span className="fuel fuel--battery"><span style={{ width: `${hud.battery}%` }} /></span></span>
            <span className="t-label">Target rock <b>{hud.dist} m</b></span>
            {hud.analyze > 0 && <span className="t-label c-cyan">Analyzing {Math.round(hud.analyze * 100)}%</span>}
          </>
        ) : timing ? (
          <>
            <span className="t-label">{site.task === "scoop" ? "Soil scoop" : "Seismometer"}</span>
            <span className="t-label">Tries <b>{hud.tries}</b></span>
          </>
        ) : phase === "entry" ? (
          <>
            <span className="t-label">Entry · altitude <b>{hud.altKm} km</b></span>
            <span className="t-label">Speed <b>{hud.speed.toLocaleString("en-US")} m/s</b></span>
            <span className="t-label c-muted">Open the parachute between {CHUTE_EARLY} and {CHUTE_LATE} m/s</span>
          </>
        ) : (
          <>
            <span className="t-label">Altitude <b>{phase === "final" || phase === "crane" || phase === "chute" ? `${hud.alt.toLocaleString("en-US")} m` : "—"}</b></span>
            <span className="t-label">Descent <b>{phase === "final" || phase === "crane" ? `${hud.vy} m/s` : "—"}</b></span>
            {site.method !== "airbags" && <span className="t-label">Fuel <span className="fuel"><span style={{ width: `${hud.fuel}%` }} /></span></span>}
            <span className="t-label c-muted">Wind {hud.wind > 0.3 ? "→" : hud.wind < -0.3 ? "←" : "·"} {Math.abs(Math.round(hud.wind))} m/s{site.gusty ? " · gusty" : ""}</span>
          </>
        )}
      </div>

      <div className="arcade-stage">
        <canvas ref={canvasRef} className="arcade-canvas" style={{ aspectRatio: `${W} / ${H}` }} onPointerDown={() => !drive && !engines && action()} aria-label="Mars Landing game area" />

        {(phase === "ready" || phase === "crashed" || phase === "scifail") && (
          <div className="stage-overlay">
            {phase === "ready" && (
              <>
                <span className="t-caption c-cyan">Mission {siteIdx + 1} of {SITES.length} · {site.mission.year}</span>
                <h2 className="t-title">{site.mission.name} · {site.mission.site}</h2>
                <p className="t-body-sm c-muted">
                  Steer through entry, open the parachute in the safe window, then {METHOD_TEXT[site.method]}. Finally, {TASK_TEXT[site.task](site)}.
                </p>
                <p className="t-caption c-muted hide-sm">
                  Space: parachute and {site.method === "airbags" ? "rockets" : "engines (hold)"} · ← → steer{site.method !== "airbags" ? " · ↑ also fires the engines" : ""}
                </p>
              </>
            )}
            {phase === "crashed" && <CrashText crash={result.crash} result={result} site={site} />}
            {phase === "scifail" && (
              <>
                <h2 className="t-title">{site.task === "drive" ? "Battery empty" : "Missed the timing"}</h2>
                <p className="t-body-sm c-muted">
                  {site.task === "drive" ? `${site.rover} needs to stop right at the target rock. Soft soil drains the battery.` : "Press when the needle is inside the window."} Your landing still counts.
                </p>
              </>
            )}
            <button className="btn-purple t-label hide-sm" onClick={action}>
              {phase === "ready" ? "Start entry" : phase === "scifail" ? "Try the science again" : "Try again"}
            </button>
          </div>
        )}
      </div>

      <div className="landing-controls">
        <button className="pad-btn" aria-label={drive ? "Drive back" : "Steer left"} {...hold(-1)} disabled={!steerOn}><Chevron dir="left" /></button>
        <button className="btn-purple t-label action-btn" {...thrustHold}
          disabled={phase === "chute" || phase === "bounce" || drive || phase === "done" || (phase === "final" && site.method === "airbags" && hud.fired)}>
          {actionLabel}
        </button>
        <button className="pad-btn" aria-label={drive ? "Drive forward" : "Steer right"} {...hold(1)} disabled={!steerOn}><Chevron dir="right" /></button>
      </div>

      {phase === "done" && (
        <WinPanel
          title={`${site.mission.name} is exploring ${site.mission.site}!`}
          stars={result.landStars + result.sciStars}
          sourceTitle={site.mission.source.title}
          sourceUrl={site.mission.source.url}
          onAgain={() => pickSite(siteIdx)}
          againLabel="Fly this mission again"
          onNext={hasNext ? () => pickSite(siteIdx + 1) : undefined}
          nextLabel={hasNext ? `Next: ${SITES[siteIdx + 1].mission.name}` : undefined}
          facts={[site.mission.discovery, site.mission.facts[0], site.mission.epilogue]}
        >
          <figure className="win-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.mission.photo.src} alt={site.mission.photo.alt} draggable={false} />
            <figcaption className="t-caption c-muted">{site.mission.photo.alt} · {site.mission.photo.credit}</figcaption>
          </figure>
          <p className="t-body-sm c-muted">
            Touched down at {result.speed} m/s, {result.distance} m from the center of the landing zone{result.distance <= site.zone * 0.3 ? " (bullseye!)" : ""}.
            {!hasNext ? " You finished all five missions!" : ""}
          </p>
        </WinPanel>
      )}
    </div>
  );
}

function CrashText({ crash, result, site }: { crash: Crash; result: { distance: number; speed: number }; site: Site }) {
  const t: Record<Crash, [string, string]> = {
    tore: ["The parachute tore", `It opened at ${result.speed.toLocaleString("en-US")} m/s, too fast for the fabric. Wait until the speed is inside the window.`],
    late: ["Parachute too late", "The air slowed the capsule, but the parachute never opened. Open it inside the window."],
    fast: ["Too fast!", `The lander hit the ground at ${result.speed} m/s. ${site.method === "airbags" ? "" : "Start the engines earlier and keep the descent under 3 m/s."}`],
    rock: ["Landed on a boulder", "The lander tipped over on a rock. Steer to a clear patch of ground."],
    burst: ["The airbags burst", `They hit the ground at ${result.speed} m/s. Fire the rockets when the lander is between about 70 and 135 m up.`],
    off: ["Safe, but off target", `You landed gently, ${result.distance} m from the center of the zone (+1 star), but too far for the science. Steer closer during entry.`],
    fuel: ["Out of fuel", "The engines ran dry before touchdown. Cut the parachute a little lower, and only fire the engines when you need to slow down."],
  };
  const [h, p] = t[crash];
  return (
    <>
      <h2 className="t-title">{h}</h2>
      <p className="t-body-sm c-muted">{p}</p>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Physics for the last few hundred meters
// ---------------------------------------------------------------------------------------------

type CrashFn = (c: Crash, extra?: { speed?: number; distance?: number }) => void;

function stepFinal(s: Sim, dt: number, steer: number, thrust: boolean, crash: CrashFn, land: (x: number, v: number) => void, bounce: () => void, crane: () => void) {
  const st = s.site;
  s.burning = false;
  if (st.method === "airbags") {
    // hanging under the parachute until the rockets fire
    if (s.rocketsAt < 0) {
      s.vy += (-62 - s.vy) * Math.min(1, dt);
      s.x += s.wind * dt;
      if (s.alt <= 0) return crash("burst", { speed: Math.round(-s.vy) });
    } else {
      // rockets brake hard; when the lander is nearly stopped the bridle is cut and the airbag ball drops
      s.bagH = Math.min(1, s.bagH + dt * 3);
      if (s.vy < -3 && s.alt > 0) {
        s.burning = true;
        s.vy += 26 * dt;
      } else {
        s.ball = { x: s.x, y: Math.max(0, s.alt), vx: 4 + s.wind, vy: s.vy, bounces: 0, rest: 0 };
        s.flyAway = 0.01;
        return bounce();
      }
      s.x += s.wind * dt * 0.5;
    }
    s.alt += s.vy * dt;
    return;
  }

  // landing engines (Viking, InSight) and the sky crane (Perseverance)
  if (!s.cutAt) {
    s.vy += (-62 - s.vy) * Math.min(1, dt);
    s.x += s.wind * dt;
    if (s.alt < 260) s.cutAt = s.alt; // automatic cut so the player always gets a chance
  } else {
    let ax = 0, ay = -MARS_G;
    if (thrust && s.fuel > 0) {
      ay += 8.6;
      s.fuel = Math.max(0, s.fuel - 3 * dt);
      s.burning = true;
    }
    if (steer && s.fuel > 0) {
      ax += steer * 2.4;
      s.fuel = Math.max(0, s.fuel - 0.8 * dt);
    }
    ax += (s.wind - s.vx) * 0.05;
    s.vx += ax * dt;
    s.vy += ay * dt;
    s.x += s.vx * dt;
  }
  s.alt += s.vy * dt;

  if (st.method === "skycrane" && s.cutAt) {
    if (s.cable === 0 && s.alt < 22 && s.alt > 8 && -s.vy < 3) {
      s.cable = 0.01;
      crane();
    }
    if (s.cable > 0) {
      s.cable = Math.min(7.5, s.cable + dt * 2.6);
      s.craneT += dt;
    }
    const roverAlt = s.alt - s.cable;
    if (roverAlt <= 0 && s.cable > 0) {
      const v = Math.round(-s.vy * 10) / 10;
      if (-s.vy > 2.5) return crash("fast", { speed: v });
      if (onRock(st, s.x)) return crash("rock");
      s.flyAway = 0.01;
      return land(s.x, v);
    }
  }
  if (s.alt <= 0) {
    s.alt = 0;
    const v = Math.round(-s.vy * 10) / 10;
    puff(s, s.x, 22);
    if (st.method === "skycrane") return crash("fast", { speed: v });
    if (-s.vy > 3 || Math.abs(s.vx) > 2.5) return crash("fast", { speed: v });
    if (onRock(st, s.x)) return crash("rock");
    return land(s.x, v);
  }
  if (s.alt < 30 && s.burning) puff(s, s.x, 2);
}

function stepBounce(s: Sim, dt: number, crash: CrashFn, land: (x: number, v: number) => void) {
  const b = s.ball;
  const k = dt * 1.6; // bounces play a little faster than real time
  b.vy -= MARS_G * k;
  b.x += b.vx * k;
  b.y += b.vy * k;
  s.x = b.x;
  s.alt = b.y;
  if (b.y <= 0) {
    if (b.bounces === 0 && -b.vy > 22) return crash("burst", { speed: Math.round(-b.vy) });
    b.y = 0;
    b.bounces++;
    puff(s, b.x, 10);
    b.vy = -b.vy * 0.55;
    b.vx *= 0.75;
    if (b.vy < 1.2) {
      b.vy = 0;
      b.vx *= 0.9;
      if (Math.abs(b.vx) < 0.3) {
        s.open = 0.01;
        return land(b.x, 0);
      }
    }
  }
}

const onRock = (st: Site, x: number) => st.rocks.some(([r, rad]) => Math.abs(x - r) < rad + 1.4);
function puff(s: Sim, x: number, n: number) {
  for (let i = 0; i < n; i++) s.dust.push({ x: x + (Math.random() - 0.5) * 3, y: 0.2, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 2, life: Math.random() * 0.6 });
}

// ---------------------------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------------------------

const hash = (n: number) => {
  const v = Math.sin(n * 127.1) * 43758.5453;
  return v - Math.floor(v);
};

function draw(ctx: CanvasRenderingContext2D, s: Sim, phase: Phase, t: number, mars?: HTMLImageElement) {
  if (phase === "entry" || phase === "ready") return drawEntry(ctx, s, t, mars);
  if (phase === "crashed" && s.chuteAt === 0) return drawEntry(ctx, s, t, mars);

  const st = s.site;
  const science = phase === "science" || phase === "done" || phase === "scifail";
  const alt = science ? 0 : Math.max(0, phase === "chute" ? FINAL_ALT + 1 : s.alt);
  const k = pxPerM(alt);
  const camX = science ? s.x + 8 : s.x;
  const sx = (wx: number) => W / 2 + (wx - camX) * k;

  // Martian daytime sky: butterscotch, paler at the horizon
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, "#a77d5e");
  sky.addColorStop(0.65, "#d3ab86");
  sky.addColorStop(1, "#e6c9a6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // distant ridges and mesas (parallax)
  ridge(ctx, camX * 0.02, GROUND - 120, 26, "#b48a6c", 300);
  ridge(ctx, camX * 0.06, GROUND - 70, 30, "#a06f50", 180);
  ridge(ctx, camX * 0.15, GROUND - 30, 16, "#8f5c3e", 90);

  // ground
  const gg = ctx.createLinearGradient(0, GROUND, 0, H);
  gg.addColorStop(0, "#9a5d3b");
  gg.addColorStop(1, "#6e3f27");
  ctx.fillStyle = gg;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  // pebbles, only when close enough to see them
  if (k > 1.2) {
    const span = W / 2 / k;
    for (let m = Math.floor(camX - span); m < camX + span; m += 0.5) {
      const h = hash(m * 2);
      if (h > 0.55) continue;
      const r = (0.04 + h * 0.12) * k;
      ctx.fillStyle = h > 0.3 ? "rgba(70,38,22,0.45)" : "rgba(200,150,110,0.35)";
      ctx.fillRect(sx(m), GROUND + 2 + hash(m * 7) * (H - GROUND - 6), r, r * 0.6);
    }
  }

  // landing zone (shown once it is in view)
  if (!science && k > 0.25) {
    const z = st.zone;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(sx(-z), GROUND + 4);
    ctx.lineTo(sx(z), GROUND + 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff";
    for (const e of [-z, z]) ctx.fillRect(sx(e) - 1, GROUND - 10, 2, 16);
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.fillText(`${st.mission.site.toUpperCase()} · LANDING ZONE`, Math.max(10, sx(-z)), GROUND + 24);
  }

  // soft soil for the rover
  if (science && st.task === "drive") {
    for (const [a, b] of st.sand) {
      ctx.fillStyle = "rgba(226,178,128,0.75)";
      ctx.fillRect(sx(s.x + a), GROUND - 2, (b - a) * k, 6);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.fillText("SOFT SOIL", sx(s.x + a), GROUND + 20);
    }
  }

  // boulders
  for (const [rx, rr] of st.rocks) {
    const px = sx(rx);
    if (px < -60 || px > W + 60 || rr * k < 0.8) continue;
    boulder(ctx, px, GROUND, rr * k, rx);
  }
  // target rock for the rover
  if (st.task === "drive" && science) {
    const px = sx(s.target);
    boulder(ctx, px, GROUND, 0.8 * k, 99);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(px - 1.6 * k, GROUND - 1.9 * k, 3.2 * k, 1.9 * k);
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 11px system-ui, sans-serif";
    ctx.fillText("TARGET ROCK", px - 36, GROUND - 2.2 * k);
  }

  // falling heat shield
  if (s.shieldDrop >= 0 && phase === "chute") {
    s.shieldDrop += 0.016;
    ctx.save();
    ctx.translate(W / 2 + 30, 160 + s.shieldDrop * 900);
    ctx.rotate(s.shieldDrop * 3);
    ctx.fillStyle = "#4a3424";
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI);
    ctx.fill();
    ctx.restore();
  }

  // dust
  for (const d of s.dust) {
    ctx.fillStyle = `rgba(200,150,110,${0.5 * (1 - d.life / 2.5)})`;
    ctx.beginPath();
    ctx.arc(sx(d.x), GROUND - d.y * k, (0.6 + d.life * 1.5) * Math.max(4, k), 0, Math.PI * 2);
    ctx.fill();
  }

  // the spacecraft
  const ly = phase === "chute" ? 170 : GROUND - lift(alt);
  const lx = phase === "bounce" || science || phase === "crashed" ? sx(s.x) : W / 2;
  if (phase === "chute") {
    capsule(ctx, lx, ly, t, s.chute, s.shieldDrop < 0, 0);
  } else if (st.method === "airbags") {
    if (phase === "final") {
      if (s.rocketsAt < 0) chuteAbove(ctx, lx, ly - 120, t, 1);
      backshell(ctx, lx, ly - 52 * S, s.burning, t);
      ctx.strokeStyle = "rgba(60,50,40,0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, ly - 44 * S);
      ctx.lineTo(lx, ly - 22 * S);
      ctx.stroke();
      airbags(ctx, lx, ly - 18 * S, 0.55 + 0.45 * s.bagH, 0);
    } else if (phase === "bounce" || (phase === "crashed" && s.ball.bounces > 0)) {
      airbags(ctx, lx, GROUND - Math.max(0, s.ball.y) * k - 24 * S, 1, s.ball.x * 0.5);
      if (s.flyAway > 0) backshell(ctx, lx + 80 + s.flyAway * 120, 40 - s.flyAway * 30, false, t);
    } else if (science) {
      petals(ctx, lx, GROUND, s.open);
    } else airbags(ctx, lx, ly - 24 * S, 1, 0);
  } else if (st.method === "engines") {
    if (phase === "final" && !s.cutAt) chuteAbove(ctx, lx, ly - 110, t, 1);
    lander(ctx, lx, phase === "final" || phase === "crashed" ? ly : GROUND, st.mission.id === "insight", s.burning, t, phase === "crashed" && s.wreck);
  } else {
    // sky crane
    const hanging = phase === "final" || phase === "crane" || phase === "crashed";
    const roverY = hanging ? GROUND - lift(Math.max(0, alt - s.cable)) : GROUND;
    const descY = hanging ? ly - 34 * S : 60 - s.flyAway * 80;
    const descX = science ? lx - 20 - s.flyAway * 200 : lx;
    if (phase === "final" && !s.cutAt) chuteAbove(ctx, lx, descY - 90, t, 1);
    descentStage(ctx, descX, descY, s.burning || science, t);
    if (phase === "crane" || phase === "final") {
      ctx.strokeStyle = "rgba(40,40,40,0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(descX - 6 * S, descY + 8 * S);
      ctx.lineTo(lx - 8 * S, roverY - 24 * S);
      ctx.moveTo(descX + 6 * S, descY + 8 * S);
      ctx.lineTo(lx + 8 * S, roverY - 24 * S);
      ctx.stroke();
    }
    if (!science) rover(ctx, lx, roverY, "Perseverance", 0);
  }

  // rover on the ground
  if (science && st.task === "drive") {
    const rx = sx(s.rover.x);
    rover(ctx, rx, GROUND, st.rover ?? "", s.rover.x * 3);
    if (s.rover.analyze > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 14 * S, GROUND - 16 * S);
      ctx.lineTo(rx + 28 * S, GROUND - 6 * S);
      ctx.stroke();
    }
  }
  // lander science: robot arm (scoop) or the seismometer dome
  if (science && st.task !== "drive") {
    const lxx = sx(s.x);
    const reach = phase === "done" ? 1 : 0.45 + 0.15 * Math.sin(t / 300);
    ctx.strokeStyle = "#d9d5cc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lxx + 18 * S, GROUND - 26 * S);
    ctx.lineTo(lxx + 46 * S, GROUND - 46 * S);
    ctx.lineTo(lxx + 62 * S, GROUND - (46 - 44 * reach) * S);
    ctx.stroke();
    if (st.task === "seismo" && phase === "done") {
      ctx.fillStyle = "#e8e4dc";
      ctx.beginPath();
      ctx.ellipse(lxx + 64 * S, GROUND, 13 * S, 11 * S, 0, Math.PI, 0);
      ctx.fill();
    }
  }

  // HUD overlays on the canvas
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.fillStyle = "rgba(40,24,14,0.85)";
  const tip =
    phase === "chute" ? (s.shieldDrop >= 0 ? "Heat shield released. Falling under the parachute…" : "Parachute open!")
      : phase === "final" && st.method === "airbags" && s.rocketsAt < 0 ? "Fire the rockets when the lander is 70 to 135 m above the ground"
      : phase === "final" && st.method !== "airbags" && !s.cutAt ? "Cut the parachute and start the engines (lower = less fuel, but less time)"
      : (phase === "final" || phase === "crane") && st.method !== "airbags" ? (st.method === "skycrane" ? "Hold the engines to slow down. Below 20 m at under 3 m/s, the sky crane lowers the rover" : "Hold the engines to slow down. Touch down under 3 m/s on clear ground")
      : phase === "bounce" ? "Bouncing on the airbags…"
      : science && st.task === "drive" ? "Hold → to drive, let go to stop. Stop at the target rock to analyze it."
      : "";
  if (tip) ctx.fillText(tip, 16, 28);

  if (phase === "science" && st.task !== "drive") {
    const bw = 420, bx = (W - bw) / 2, by = 64;
    const win = st.window ?? 0.15;
    ctx.fillStyle = "rgba(30,20,14,0.75)";
    ctx.fillRect(bx - 16, by - 34, bw + 32, 74);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(st.task === "scoop" ? "Press when the needle is in the window: scoop the soil" : "Press when the needle is in the window: place the seismometer", bx, by - 12);
    ctx.fillStyle = "#5a4a3e";
    ctx.fillRect(bx, by, bw, 18);
    ctx.fillStyle = s.missFlash > 0 ? "#c0503e" : "#86b36f";
    ctx.fillRect(bx + bw * (0.5 - win / 2), by, bw * win, 18);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bx + bw * (0.5 + 0.5 * Math.sin(s.needle)) - 2, by - 5, 4, 28);
  }
}

function drawEntry(ctx: CanvasRenderingContext2D, s: Sim, t: number, mars?: HTMLImageElement) {
  const k = Math.min(1, s.t / ENTRY_T);
  // black space turning into thin, dusty air
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, `rgb(${Math.round(8 + 120 * k * k)},${Math.round(8 + 80 * k * k)},${Math.round(14 + 50 * k * k)})`);
  sky.addColorStop(1, `rgb(${Math.round(30 + 170 * k)},${Math.round(20 + 120 * k)},${Math.round(20 + 80 * k)})`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - k * 1.4)})`;
  for (let i = 0; i < 80; i++) ctx.fillRect(hash(i) * W, hash(i + 50) * H * 0.6, 1.2, 1.2);

  // Mars below, growing as we fall (real NASA image)
  const R = 900 + k * 2600;
  const cy = H + R - 120 - k * 40;
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2 - s.xKm * 30, cy, R, 0, Math.PI * 2);
  ctx.clip();
  // place the image's middle (not the polar cap) at the visible horizon
  if (mars?.complete && mars.naturalWidth) ctx.drawImage(mars, W / 2 - s.xKm * 30 - R, cy - R * 2 + 260, R * 2, R * 2);
  else {
    ctx.fillStyle = "#b5653c";
    ctx.fill();
  }
  ctx.fillStyle = `rgba(214,170,130,${0.08 + 0.35 * k})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // the landing site on the surface, and the capsule's track toward it
  const siteX = W / 2 - s.xKm * 60;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(siteX, H - 70, 46, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(s.site.mission.site.toUpperCase(), siteX, H - 88);
  ctx.textAlign = "start";

  const tilt = Math.max(-0.35, Math.min(0.35, s.vxKm * 0.4));
  capsule(ctx, W / 2, 200, t, 0, true, Math.min(1, k * 2.2) * (1 - Math.max(0, (k - 0.85) / 0.15)), tilt);

  // course and parachute gauges
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const off = Math.abs(s.xKm);
  ctx.fillText(off < 0.4 ? "On course for the landing site" : `${off.toFixed(1)} km off course: steer ${s.xKm > 0 ? "left" : "right"}`, 16, 28);

  const gx = W - 260, gy = 20, gw = 240;
  const toX = (v: number) => gx + gw * (1 - (v - 200) / 1000);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(gx - 8, gy - 4, gw + 16, 46);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(gx, gy + 16, gw, 8);
  ctx.fillStyle = "#86b36f";
  ctx.fillRect(toX(CHUTE_EARLY), gy + 16, toX(CHUTE_LATE) - toX(CHUTE_EARLY), 8);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(Math.max(gx, Math.min(gx + gw, toX(s.speed))) - 2, gy + 10, 4, 20);
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillText("PARACHUTE WINDOW", gx, gy + 8);
  ctx.fillText(s.speed > 1200 ? "slowing down…" : `${Math.round(s.speed)} m/s`, gx + gw - 70, gy + 8);
}

function ridge(ctx: CanvasRenderingContext2D, off: number, base: number, amp: number, color: string, scale: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, GROUND + 1);
  for (let x = 0; x <= W; x += 12) {
    const wx = x + off * 40;
    const y = base - amp * (Math.sin(wx / scale) * 0.6 + Math.sin(wx / (scale * 0.37) + 1.7) * 0.3 + Math.abs(Math.sin(wx / (scale * 2.3))) * 0.6);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, GROUND + 1);
  ctx.fill();
}

function boulder(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) {
  ctx.fillStyle = "rgba(40,20,10,0.35)";
  ctx.beginPath();
  ctx.ellipse(x + r * 0.5, y + 1, r * 1.2, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y);
  g.addColorStop(0, "#9b6a4d");
  g.addColorStop(1, "#4e2e1d");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - r * 1.1, y);
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    const m = 0.75 + hash(seed * 13 + i) * 0.35;
    ctx.lineTo(x + Math.cos(a) * r * 1.1 * m, y + Math.sin(a) * r * m);
  }
  ctx.lineTo(x + r * 1.1, y);
  ctx.closePath();
  ctx.fill();
}

/** Entry capsule: dark heat shield below, white backshell above, glowing hot air around the shield. */
function capsule(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, chute: number, shield: boolean, heat: number, tilt = 0) {
  if (chute > 0) chuteAbove(ctx, x, y - 70, t, chute);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  if (heat > 0.02) {
    const g = ctx.createRadialGradient(0, 22, 4, 0, 30, 90);
    g.addColorStop(0, `rgba(255,244,220,${0.95 * heat})`);
    g.addColorStop(0.3, `rgba(255,170,90,${0.8 * heat})`);
    g.addColorStop(1, "rgba(255,110,60,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 26, 90 * (0.8 + 0.2 * Math.sin(t / 60)), 46, 0, 0, Math.PI * 2);
    ctx.fill();
    // hot gas streaming past the capsule
    ctx.strokeStyle = `rgba(255,200,160,${0.22 * heat})`;
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 12, 26);
      ctx.quadraticCurveTo(i * 22, -20, i * 16, -90 - ((t / 4 + i * 37) % 30));
      ctx.stroke();
    }
  }
  const bs = ctx.createLinearGradient(-30, 0, 30, 0);
  bs.addColorStop(0, "#8e8b84");
  bs.addColorStop(0.35, "#efede8");
  bs.addColorStop(1, "#8e8b84");
  ctx.fillStyle = bs;
  ctx.beginPath();
  ctx.moveTo(-34, 16);
  ctx.lineTo(-12, -22);
  ctx.lineTo(12, -22);
  ctx.lineTo(34, 16);
  ctx.closePath();
  ctx.fill();
  if (shield) {
    ctx.fillStyle = "#4a3424";
    ctx.beginPath();
    ctx.ellipse(0, 16, 35, 10, 0, 0, Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

/** Disk-gap-band parachute, orange and white gores. */
function chuteAbove(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, open: number) {
  const w = 20 + 70 * open;
  const h = 14 + 26 * open;
  const sway = Math.sin(t / 700) * 3;
  ctx.strokeStyle = "rgba(70,60,50,0.6)";
  ctx.lineWidth = 1;
  for (const f of [-1, -0.5, 0, 0.5, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + sway + f * w, y);
    ctx.lineTo(x, y + 60);
    ctx.stroke();
  }
  const gores = 8;
  for (let i = 0; i < gores; i++) {
    const a0 = Math.PI + (i / gores) * Math.PI;
    const a1 = Math.PI + ((i + 1) / gores) * Math.PI;
    ctx.fillStyle = i % 2 ? "#f3efe6" : "#d4622f";
    ctx.beginPath();
    ctx.moveTo(x + sway, y);
    ctx.ellipse(x + sway, y, w, h, 0, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(x + sway - w, y - 2, w * 2, 3);
}

function backshell(ctx: CanvasRenderingContext2D, x: number, y: number, burning: boolean, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);
  ctx.translate(-x, -y);
  _backshell(ctx, x, y, burning, t);
  ctx.restore();
}
function _backshell(ctx: CanvasRenderingContext2D, x: number, y: number, burning: boolean, t: number) {
  if (burning) {
    for (const dx of [-14, 0, 14]) {
      ctx.save();
      ctx.translate(x + dx, y + 10);
      ctx.rotate(Math.PI + dx * 0.02);
      flame(ctx, 0, 0, 5, 20, t + dx * 30, 0);
      ctx.restore();
    }
  }
  const bs = ctx.createLinearGradient(x - 28, 0, x + 28, 0);
  bs.addColorStop(0, "#8e8b84");
  bs.addColorStop(0.35, "#efede8");
  bs.addColorStop(1, "#8e8b84");
  ctx.fillStyle = bs;
  ctx.beginPath();
  ctx.moveTo(x - 28, y + 10);
  ctx.lineTo(x - 10, y - 20);
  ctx.lineTo(x + 10, y - 20);
  ctx.lineTo(x + 28, y + 10);
  ctx.closePath();
  ctx.fill();
}

/** Pathfinder/Spirit airbags: a cluster of round white lobes. */
function airbags(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, spin: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);
  ctx.translate(-x, -y);
  _airbags(ctx, x, y, size, spin);
  ctx.restore();
}
function _airbags(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, spin: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.scale(size, size);
  const lobes: [number, number][] = [[-12, 6], [12, 6], [0, -10], [0, 10], [-14, -8], [14, -8]];
  for (const [lx, ly] of lobes) {
    const g = ctx.createRadialGradient(lx - 4, ly - 5, 2, lx, ly, 15);
    g.addColorStop(0, "#fbf9f4");
    g.addColorStop(1, "#b9b3a6");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lx, ly, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(120,110,95,0.4)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(lx, ly, 9, 0.3, 2.2);
    ctx.stroke();
  }
  ctx.restore();
}

/** After landing, the airbags pull in and the lander's petals open. */
function petals(ctx: CanvasRenderingContext2D, x: number, y: number, open: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);
  ctx.translate(-x, -y);
  _petals(ctx, x, y, open);
  ctx.restore();
}
function _petals(ctx: CanvasRenderingContext2D, x: number, y: number, open: number) {
  ctx.fillStyle = "rgba(200,192,178,0.85)";
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 40 * (1 - open * 0.4), 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#cfc9bd";
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 4);
  ctx.lineTo(x - 14 - 26 * open, y - 4 - 18 * (1 - open));
  ctx.lineTo(x - 14 - 30 * open, y - 2);
  ctx.closePath();
  ctx.moveTo(x + 14, y - 4);
  ctx.lineTo(x + 14 + 26 * open, y - 4 - 18 * (1 - open));
  ctx.lineTo(x + 14 + 30 * open, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#b8b2a6";
  ctx.fillRect(x - 14, y - 12, 28, 8);
  // solar cells on the base petal
  ctx.fillStyle = "#1f2c4a";
  ctx.fillRect(x - 11, y - 11, 22, 3);
  // mast camera
  ctx.fillStyle = "#cfc9bd";
  ctx.fillRect(x - 1, y - 30, 2, 18);
  ctx.fillRect(x - 5, y - 33, 10, 4);
}

/** Viking 1 or InSight on three legs. */
function lander(ctx: CanvasRenderingContext2D, x: number, y: number, insight: boolean, burning: boolean, t: number, broken: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);
  ctx.translate(-x, -y);
  _lander(ctx, x, y, insight, burning, t, broken);
  ctx.restore();
}
function _lander(ctx: CanvasRenderingContext2D, x: number, y: number, insight: boolean, burning: boolean, t: number, broken: boolean) {
  if (burning) {
    for (const dx of [-10, 10]) {
      ctx.save();
      ctx.translate(x + dx, y - 10);
      flame(ctx, 0, 0, 5, 16, t + dx * 20, 0.3);
      ctx.restore();
    }
  }
  ctx.save();
  if (broken) {
    ctx.translate(x, y);
    ctx.rotate(0.5);
    ctx.translate(-x, -y);
  }
  ctx.strokeStyle = "#9c978d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 16); ctx.lineTo(x - 24, y - 2);
  ctx.moveTo(x + 14, y - 16); ctx.lineTo(x + 24, y - 2);
  ctx.stroke();
  ctx.fillStyle = "#8a857b";
  ctx.fillRect(x - 29, y - 3, 10, 3);
  ctx.fillRect(x + 19, y - 3, 10, 3);
  const body = ctx.createLinearGradient(x - 20, 0, x + 20, 0);
  body.addColorStop(0, "#8f8a80");
  body.addColorStop(0.4, "#e3dfd6");
  body.addColorStop(1, "#8f8a80");
  ctx.fillStyle = body;
  ctx.fillRect(x - 20, y - 26, 40, 12);
  if (insight) {
    // two round solar arrays seen edge-on
    ctx.fillStyle = "#1f2c4a";
    ctx.beginPath();
    ctx.ellipse(x - 38, y - 24, 18, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 38, y - 24, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Viking: dish antenna on a mast and the RTG power units
    ctx.fillStyle = "#cfcac0";
    ctx.fillRect(x + 6, y - 44, 2, 18);
    ctx.beginPath();
    ctx.ellipse(x + 7, y - 46, 9, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6f6a62";
    ctx.fillRect(x - 18, y - 34, 6, 8);
  }
  ctx.restore();
}

/** Perseverance's descent stage: frame with angled thruster pods. */
function descentStage(ctx: CanvasRenderingContext2D, x: number, y: number, burning: boolean, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);
  ctx.translate(-x, -y);
  _descentStage(ctx, x, y, burning, t);
  ctx.restore();
}
function _descentStage(ctx: CanvasRenderingContext2D, x: number, y: number, burning: boolean, t: number) {
  if (burning) {
    for (const dx of [-22, 22]) {
      ctx.save();
      ctx.translate(x + dx, y + 6);
      ctx.rotate(dx > 0 ? -0.25 : 0.25);
      flame(ctx, 0, 0, 5, 18, t + dx * 10, 0.3);
      ctx.restore();
    }
  }
  ctx.fillStyle = "#a9a59c";
  ctx.fillRect(x - 26, y - 6, 52, 10);
  ctx.fillStyle = "#d7d3ca";
  ctx.fillRect(x - 18, y - 12, 36, 6);
  ctx.fillStyle = "#5f5b55";
  for (const dx of [-24, 24]) ctx.fillRect(x + dx - 3, y - 2, 6, 10);
  ctx.fillStyle = "#c4c0b6";
  ctx.beginPath();
  ctx.arc(x - 10, y - 14, 5, 0, Math.PI * 2);
  ctx.arc(x + 10, y - 14, 5, 0, Math.PI * 2);
  ctx.fill();
}

/** Rovers, side view, roughly to scale with each other. */
function rover(ctx: CanvasRenderingContext2D, x: number, y: number, name: string, spin: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);
  ctx.translate(-x, -y);
  _rover(ctx, x, y, name, spin);
  ctx.restore();
}
function _rover(ctx: CanvasRenderingContext2D, x: number, y: number, name: string, spin: number) {
  const small = name === "Sojourner";
  const s = small ? 0.55 : name === "Spirit" ? 0.85 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = "#8b877e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -7); ctx.lineTo(-10, -16); ctx.lineTo(0, -7);
  ctx.moveTo(0, -7); ctx.lineTo(10, -16); ctx.lineTo(16, -7);
  ctx.stroke();
  for (const dx of [-16, 0, 16]) {
    ctx.fillStyle = "#3b3833";
    ctx.beginPath();
    ctx.arc(dx, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7d786f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dx, -6);
    ctx.lineTo(dx + Math.cos(spin) * 5, -6 + Math.sin(spin) * 5);
    ctx.stroke();
  }
  const body = ctx.createLinearGradient(0, -26, 0, -14);
  body.addColorStop(0, "#efece5");
  body.addColorStop(1, "#a9a49a");
  ctx.fillStyle = body;
  ctx.fillRect(-18, -26, 36, 11);
  if (small || name === "Spirit") {
    ctx.fillStyle = "#1f2c4a";
    ctx.fillRect(small ? -18 : -24, -29, small ? 36 : 48, 3);
  }
  if (!small) {
    ctx.fillStyle = "#d9d5cc";
    ctx.fillRect(10, -46, 3, 20);
    ctx.fillRect(6, -50, 12, 5);
  }
  if (name === "Perseverance") {
    ctx.fillStyle = "#cfcac0";
    ctx.fillRect(-20, -32, 10, 8); // MMRTG power source at the back
  }
  ctx.restore();
}
