"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WinPanel } from "./GameShell";
import { addStars } from "@/lib/stars";
import { MISSIONS, loadJSON, saveJSON, type Mission } from "@/lib/missions";

// Mars Landing: a five-mission campaign at real NASA landing sites.
// 1. The rocket flies over Mars. Release the lander at the right moment.
// 2. Steer with the side thrusters (limited fuel), open the parachute, avoid the boulders.
// 3. Do the science: rovers drive to a target rock before the battery runs out,
//    landers scoop soil or place the seismometer with good timing.
// Every mission ends with what the real mission found and where its hardware rests today.

const W = 960;
const H = 540;
const WORLD = 2800;
const G = 95; // gravity, px/s²
const SAFE_SPEED = 75; // max touchdown speed, px/s
const PX_PER_M = 2;
const FLOOR = 470;
const SAVE_KEY = "cj-landing";

type Task = "drive" | "scoop" | "seismo";
type Terrain = "plains" | "rocky" | "crater";

interface Site {
  mission: Mission;
  zone: [number, number];
  wind: number;
  gusty: boolean;
  terrain: Terrain;
  rocks: number[];
  sand: [number, number][]; // soft-soil patches (relative to the zone's right edge)
  rocketVx: number;
  fuel: number;
  task: Task;
  rover?: string;
  window?: number; // timing window size for lander tasks
}

const SITES: Site[] = [
  { mission: MISSIONS.viking1, zone: [1900, 2200], wind: 10, gusty: false, terrain: "plains", rocks: [], sand: [], rocketVx: 210, fuel: 100, task: "scoop", window: 0.18 },
  { mission: MISSIONS.pathfinder, zone: [1950, 2170], wind: 22, gusty: false, terrain: "rocky", rocks: [2005], sand: [[90, 130]], rocketVx: 230, fuel: 100, task: "drive", rover: "Sojourner" },
  { mission: MISSIONS.spirit, zone: [1980, 2160], wind: 28, gusty: false, terrain: "crater", rocks: [2030, 2125], sand: [[50, 110], [140, 175]], rocketVx: 240, fuel: 90, task: "drive", rover: "Spirit" },
  { mission: MISSIONS.insight, zone: [1970, 2170], wind: 30, gusty: true, terrain: "plains", rocks: [], sand: [], rocketVx: 245, fuel: 85, task: "seismo", window: 0.11 },
  { mission: MISSIONS.perseverance, zone: [2000, 2150], wind: 30, gusty: true, terrain: "crater", rocks: [2025, 2112], sand: [[60, 100], [150, 180]], rocketVx: 255, fuel: 80, task: "drive", rover: "Perseverance" },
];

const TASK_TEXT: Record<Task, (s: Site) => string> = {
  drive: (s) => `drive ${s.rover} to the target rock before its battery runs out`,
  scoop: () => "scoop a soil sample for the biology lab",
  seismo: () => "place the seismometer on the ground",
};

const smooth = (v: number) => Math.max(0, Math.min(1, v));

function makeGround(site: Site) {
  const [from, to] = site.zone;
  const amp = site.terrain === "plains" ? 9 : 24;
  return (x: number) => {
    // Flat landing zone, blending smoothly into the bumpy terrain around it.
    const out = x < from - 40 ? from - 40 - x : x > to + 40 ? x - to - 40 : 0;
    const w = smooth(out / 80);
    let y = FLOOR - w * amp * (Math.sin(x / 140) + 0.55 * Math.sin(x / 53 + 1.3));
    if (x < 400) y -= (400 - x) * 0.08;
    if (site.terrain === "crater") {
      // Crater walls rise far to the left and right of the floor.
      const d = Math.max(from - 260 - x, x - (to + 330), 0);
      y -= Math.min(d, 170) * 0.85;
    }
    return y;
  };
}

type Phase = "ready" | "flight" | "fall" | "science" | "done" | "crashed" | "missed" | "scifail";
type Crash = "fast" | "rock" | "off";
interface Save { unlocked: number; best: Record<string, number> }
const EMPTY_SAVE: Save = { unlocked: 0, best: {} };

export default function MarsLanding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [siteIdx, setSiteIdx] = useState(0);
  const site = SITES[siteIdx];
  const [save, setSave] = useState<Save>(EMPTY_SAVE);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hud, setHud] = useState({ alt: 0, speed: 0, fuel: 100, chute: false, wind: 0, battery: 100, dist: 0, analyze: 0, tries: 3 });
  const [result, setResult] = useState({ landStars: 0, sciStars: 0, distance: 0, speed: 0, crash: "fast" as Crash });

  const sim = useRef({
    site: SITES[0], ground: makeGround(SITES[0]),
    rocket: { x: 80, y: 110, vx: 230 },
    lander: { x: 0, y: 0, vx: 0, vy: 0 },
    chute: false, chuteT: 0, fuel: 100, wind: 0, gust: 0,
    rover: { x: 0, v: 0, battery: 100, analyze: 0, out: 0 },
    target: 0, needle: 0, tries: 3, hitFlash: 0, missFlash: 0,
    keys: new Set<string>(), pad: 0,
  });
  const phaseRef = useRef<Phase>("ready");
  phaseRef.current = phase;
  // Change phase right away, so the game loop never handles the same event twice.
  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  useEffect(() => setSave(loadJSON(SAVE_KEY, EMPTY_SAVE)), []);

  // Expose the simulation for automated play-tests (development only).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __landing: unknown }).__landing = sim.current;
  }, []);

  const reset = useCallback((idx: number) => {
    const s = sim.current;
    const st = SITES[idx];
    s.site = st;
    s.ground = makeGround(st);
    s.rocket = { x: 80, y: 110, vx: st.rocketVx };
    s.lander = { x: 0, y: 0, vx: 0, vy: 0 };
    s.chute = false;
    s.chuteT = 0;
    s.fuel = st.fuel;
    s.wind = Math.round((Math.random() * 2 - 1) * st.wind);
    s.gust = 2.5;
    s.rover = { x: 0, v: 0, battery: 100, analyze: 0, out: 0 };
    s.target = st.zone[1] + 210;
    s.tries = 3;
    s.hitFlash = 0;
    s.missFlash = 0;
    setHud({ alt: 0, speed: 0, fuel: st.fuel, chute: false, wind: s.wind, battery: 100, dist: 0, analyze: 0, tries: 3 });
  }, []);

  useEffect(() => reset(0), [reset]);

  const pickSite = (i: number) => {
    setSiteIdx(i);
    reset(i);
    go("ready");
  };

  const startScience = () => {
    const s = sim.current;
    s.rover = { x: s.lander.x + 18, v: 0, battery: 100, analyze: 0, out: 0 };
    s.tries = 3;
    s.needle = 0;
    go("science");
  };

  // Lander task: press when the needle is inside the green window.
  const tryTiming = () => {
    const s = sim.current;
    const pos = 0.5 + 0.5 * Math.sin(s.needle);
    const win = s.site.window ?? 0.15;
    if (Math.abs(pos - 0.5) < win / 2) {
      s.hitFlash = 1;
      finishScience(true);
    } else {
      s.tries -= 1;
      s.missFlash = 0.5;
      setHud((h) => ({ ...h, tries: s.tries }));
      if (s.tries <= 0) finishScience(false);
    }
  };

  const finishScience = (ok: boolean) => {
    if (phaseRef.current !== "science") return;
    if (!ok) {
      go("scifail");
      return;
    }
    const sciStars = 3;
    addStars(sciStars);
    setResult((r) => {
      const total = r.landStars + sciStars;
      setSave((sv) => {
        const id = sim.current.site.mission.id;
        const idx = SITES.findIndex((x) => x.mission.id === id);
        const next = {
          unlocked: Math.max(sv.unlocked, Math.min(SITES.length - 1, idx + 1)),
          best: { ...sv.best, [id]: Math.max(sv.best[id] ?? 0, total) },
        };
        saveJSON(SAVE_KEY, next);
        return next;
      });
      return { ...r, sciStars };
    });
    go("done");
  };
  const finishRef = useRef(finishScience);
  finishRef.current = finishScience;

  const action = useCallback(() => {
    const s = sim.current;
    const p = phaseRef.current;
    if (p === "ready" || p === "crashed" || p === "missed") {
      reset(SITES.indexOf(s.site));
      go("flight");
    } else if (p === "flight") {
      s.lander = { x: s.rocket.x, y: s.rocket.y + 26, vx: s.rocket.vx, vy: 0 };
      go("fall");
    } else if (p === "fall" && !s.chute) {
      s.chute = true;
    } else if (p === "science" && s.site.task !== "drive") {
      tryTiming();
    } else if (p === "scifail") {
      startScience();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  // Keyboard
  useEffect(() => {
    const keys = sim.current.keys;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ([" ", "enter", "arrowleft", "arrowright", "arrowdown", "arrowup"].includes(k)) e.preventDefault();
      if (k === " " || k === "enter" || k === "arrowdown") {
        if (!e.repeat) action();
      } else keys.add(k);
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
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

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const s = sim.current;
      const st = s.site;
      const ground = s.ground;
      const p = phaseRef.current;

      let steer = s.pad;
      if (s.keys.has("arrowleft") || s.keys.has("a")) steer -= 1;
      if (s.keys.has("arrowright") || s.keys.has("d")) steer += 1;
      steer = Math.max(-1, Math.min(1, steer));

      if (p === "flight" || p === "fall") {
        s.rocket.x += s.rocket.vx * dt;
        if (p === "flight" && s.rocket.x > WORLD + 120) go("missed");
      }

      if (p === "fall") {
        const L = s.lander;
        if (st.gusty) {
          s.gust -= dt;
          if (s.gust <= 0) {
            s.gust = 2.2 + Math.random();
            s.wind = Math.round((Math.random() * 2 - 1) * st.wind);
          }
        }
        if (steer && s.fuel > 0) {
          L.vx += steer * 130 * dt;
          s.fuel = Math.max(0, s.fuel - 22 * dt);
        }
        L.vy += G * dt;
        if (s.chute) {
          s.chuteT = Math.min(1, s.chuteT + dt * 2.5);
          // Drag pulls the fall speed down toward ~58 px/s (about 29 m/s), safely under the limit.
          if (L.vy > 42) L.vy -= (L.vy - 42) * Math.min(1, 6 * dt * s.chuteT);
          L.vx += (s.wind - L.vx) * Math.min(1, 0.8 * dt);
        } else {
          L.vx *= 1 - 0.06 * dt;
        }
        L.x += L.vx * dt;
        L.y += L.vy * dt;
        L.x = Math.max(20, Math.min(WORLD - 20, L.x));

        if (L.y + 16 >= ground(L.x)) {
          L.y = ground(L.x) - 16;
          const speed = Math.round(L.vy / PX_PER_M);
          const [from, to] = st.zone;
          const mid = (from + to) / 2;
          const distance = Math.round(Math.abs(L.x - mid) / PX_PER_M);
          const onRock = st.rocks.some((r) => Math.abs(L.x - r) < 18);
          if (L.vy > SAFE_SPEED || onRock) {
            setResult({ landStars: 0, sciStars: 0, distance, speed, crash: onRock ? "rock" : "fast" });
            go("crashed");
          } else if (L.x < from || L.x > to) {
            addStars(1);
            setResult({ landStars: 1, sciStars: 0, distance, speed, crash: "off" });
            go("crashed");
          } else {
            const landStars = 3 + (distance <= 15 ? 2 : 0);
            addStars(landStars);
            setResult({ landStars, sciStars: 0, distance, speed, crash: "fast" });
            go("science");
            s.rover = { x: L.x + 18, v: 0, battery: 100, analyze: 0, out: 0 };
            s.tries = 3;
          }
          L.vx = 0;
          L.vy = 0;
        }
      }

      if (p === "science") {
        if (st.task === "drive") {
          const R = s.rover;
          R.out = Math.min(1, R.out + dt * 1.5); // roll off the lander first
          const inSand = st.sand.some(([a, b]) => R.x >= st.zone[1] + a && R.x <= st.zone[1] + b);
          const max = inSand ? 30 : 70;
          if (R.out >= 1 && steer && R.battery > 0) {
            R.v += steer * 90 * dt;
            R.battery = Math.max(0, R.battery - (inSand ? 15 : 7) * dt);
          } else {
            R.v -= R.v * Math.min(1, 4 * dt);
          }
          R.v = Math.max(-max * 0.6, Math.min(max, R.v));
          R.x = Math.max(s.lander.x + 18, R.x + R.v * dt);
          R.battery = Math.max(0, R.battery - 1.2 * dt);
          const atTarget = Math.abs(R.x - s.target) < 14 && Math.abs(R.v) < 6;
          R.analyze = atTarget ? R.analyze + dt / 1.6 : Math.max(0, R.analyze - dt);
          if (R.analyze >= 1) finishRef.current(true);
          else if (R.battery <= 0 && !atTarget) finishRef.current(false);
        } else {
          s.needle += dt * (st.task === "seismo" ? 3.6 : 2.6);
        }
      }
      s.hitFlash = Math.max(0, s.hitFlash - dt);
      s.missFlash = Math.max(0, s.missFlash - dt);

      uiTick += dt;
      if (uiTick > 0.08 && (p === "fall" || p === "science")) {
        uiTick = 0;
        const L = s.lander;
        setHud({
          alt: Math.max(0, Math.round((ground(L.x) - (L.y + 16)) / PX_PER_M)),
          speed: Math.round(L.vy / PX_PER_M),
          fuel: Math.round((s.fuel / st.fuel) * 100),
          chute: s.chute,
          wind: s.wind,
          battery: Math.round(s.rover.battery),
          dist: Math.max(0, Math.round((s.target - s.rover.x) / PX_PER_M)),
          analyze: s.rover.analyze,
          tries: s.tries,
        });
      }

      draw(ctx, s, p, t);
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
  const actionLabel =
    phase === "flight" ? "Release lander"
      : phase === "fall" ? (hud.chute ? "Parachute open" : "Open parachute")
      : timing ? (site.task === "scoop" ? "Scoop!" : "Place it!")
      : drive ? (hud.analyze > 0 ? "Analyzing rock…" : "Stop on the target rock")
      : phase === "scifail" ? "Try the science again"
      : phase === "done" ? "Mission complete"
      : phase === "ready" ? "Start mission" : "Try again";
  const tooFast = phase === "fall" && hud.speed > SAFE_SPEED / PX_PER_M;
  const hasNext = siteIdx < SITES.length - 1;
  const stepsOn = phase === "fall" || drive;

  return (
    <div className="arcade landing">
      <div className="mission-picker" role="group" aria-label="Choose a landing mission">
        {SITES.map((s, i) => {
          const locked = i > save.unlocked;
          const best = save.best[s.mission.id];
          return (
            <button
              key={s.mission.id}
              className={`mission-chip${i === siteIdx ? " is-on" : ""}`}
              disabled={locked || phase === "flight" || phase === "fall" || phase === "science"}
              onClick={() => pickSite(i)}
              aria-label={`${s.mission.name}, ${s.mission.site}, ${s.mission.year}${locked ? ", locked" : ""}`}
            >
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
        ) : (
          <>
            <span className="t-label">Altitude <b>{phase === "fall" ? `${hud.alt} m` : "—"}</b></span>
            <span className={`t-label${tooFast ? " c-danger" : ""}`}>Descent <b>{phase === "fall" ? `${hud.speed} m/s` : "—"}</b></span>
            <span className="t-label">Fuel <span className="fuel"><span style={{ width: `${hud.fuel}%` }} /></span></span>
            <span className="t-label c-muted">
              Wind {hud.wind > 0 ? "→" : hud.wind < 0 ? "←" : "·"} {Math.abs(Math.round(hud.wind / PX_PER_M))} m/s{site.gusty ? " · gusty" : ""}
            </span>
          </>
        )}
      </div>

      <div className="arcade-stage">
        <canvas ref={canvasRef} className="arcade-canvas" style={{ aspectRatio: `${W} / ${H}` }} onPointerDown={() => !drive && action()} aria-label="Mars Landing game area" />

        {(phase === "ready" || phase === "crashed" || phase === "missed" || phase === "scifail") && (
          <div className="stage-overlay">
            {phase === "ready" && (
              <>
                <span className="t-caption c-cyan">Mission {siteIdx + 1} of {SITES.length} · {site.mission.year}</span>
                <h2 className="t-title">{site.mission.name} · {site.mission.site}</h2>
                <p className="t-body-sm c-muted">
                  Land the {site.task === "drive" ? `lander carrying ${site.rover}` : "lander"} in the green zone
                  {site.rocks.length ? ", away from the boulders" : ""}, then {TASK_TEXT[site.task](site)}.
                </p>
                <p className="t-caption c-muted hide-sm">
                  <kbd>Space</kbd>/tap: release, then parachute · <kbd>←</kbd> <kbd>→</kbd> steer (uses fuel) · land under {SAFE_SPEED / PX_PER_M} m/s
                </p>
              </>
            )}
            {phase === "crashed" && result.crash === "fast" && (
              <>
                <h2 className="t-title">Too fast!</h2>
                <p className="t-body-sm c-muted">You hit the ground at {result.speed} m/s. Open the parachute earlier to slow down.</p>
              </>
            )}
            {phase === "crashed" && result.crash === "rock" && (
              <>
                <h2 className="t-title">Landed on a boulder</h2>
                <p className="t-body-sm c-muted">The lander tipped over on a rock. Steer to a clear patch of the landing zone.</p>
              </>
            )}
            {phase === "crashed" && result.crash === "off" && (
              <>
                <h2 className="t-title">Safe, but off target</h2>
                <p className="t-body-sm c-muted">
                  You landed gently, {result.distance} m from the zone center (+1 star), but too far to do the science. Release a little earlier or later.
                </p>
              </>
            )}
            {phase === "missed" && (
              <>
                <h2 className="t-title">Missed the drop</h2>
                <p className="t-body-sm c-muted">The rocket flew past {site.mission.site}. Release the lander before you reach the zone.</p>
              </>
            )}
            {phase === "scifail" && (
              <>
                <h2 className="t-title">{site.task === "drive" ? "Battery empty" : "Missed the timing"}</h2>
                <p className="t-body-sm c-muted">
                  {site.task === "drive"
                    ? `${site.rover} needs to stop right on the target rock. Drive around soft soil slowly, it drains the battery.`
                    : "Press when the needle is inside the green window."}{" "}
                  Your landing still counts.
                </p>
              </>
            )}
            <button className="btn-purple t-label hide-sm" onClick={action}>
              {phase === "ready" ? "Start mission" : phase === "scifail" ? "Try the science again" : "Try again"}
            </button>
          </div>
        )}
      </div>

      <div className="landing-controls">
        <button className="pad-btn" aria-label={drive ? "Drive back" : "Steer left"} {...hold(-1)} disabled={!stepsOn}>◀</button>
        <button
          className="btn-purple t-label action-btn"
          onClick={action}
          disabled={(phase === "fall" && hud.chute) || drive || phase === "done"}
        >
          {actionLabel}
        </button>
        <button className="pad-btn" aria-label={drive ? "Drive forward" : "Steer right"} {...hold(1)} disabled={!stepsOn}>▶</button>
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
            Landed at {result.speed} m/s, {result.distance} m from the zone center{result.distance <= 15 ? " (bullseye!)" : ""}.
            {!hasNext ? " You finished all five missions!" : ""}
          </p>
        </WinPanel>
      )}
    </div>
  );
}

type Sim = {
  site: Site; ground: (x: number) => number;
  rocket: { x: number; y: number }; lander: { x: number; y: number; vx: number };
  chute: boolean; chuteT: number; wind: number;
  rover: { x: number; v: number; analyze: number; out: number };
  target: number; needle: number; tries: number; hitFlash: number; missFlash: number;
};

function draw(ctx: CanvasRenderingContext2D, s: Sim, phase: Phase, t: number) {
  const st = s.site;
  const ground = s.ground;
  const [from, to] = st.zone;
  const science = phase === "science" || phase === "done" || phase === "scifail";
  const focus =
    phase === "flight" || phase === "ready" || phase === "missed" ? s.rocket.x
      : science && st.task === "drive" ? Math.max(s.rover.x, s.lander.x + 120)
      : s.lander.x;
  const cam = Math.max(0, Math.min(WORLD - W, focus - W * 0.4));

  // Martian sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1a1245");
  sky.addColorStop(0.55, "#6b3a4f");
  sky.addColorStop(1, "#c98a6a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Distant ridges (parallax)
  ctx.fillStyle = "rgba(122, 52, 40, 0.55)";
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 16) {
    const wx = x + cam * 0.4;
    ctx.lineTo(x, 380 - 30 * Math.sin(wx / 210) - 18 * Math.sin(wx / 90));
  }
  ctx.lineTo(W, H);
  ctx.fill();

  ctx.save();
  ctx.translate(-cam, 0);

  // Ground
  ctx.fillStyle = "#a8462a";
  ctx.beginPath();
  ctx.moveTo(cam, H);
  for (let x = cam; x <= cam + W + 16; x += 8) ctx.lineTo(x, ground(x));
  ctx.lineTo(cam + W + 16, H);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let x = Math.floor(cam / 70) * 70; x < cam + W; x += 70) {
    ctx.beginPath();
    ctx.ellipse(x + 20, ground(x + 20) + 22, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft-soil patches (rover missions)
  for (const [a, b] of st.sand) {
    const x1 = to + a, x2 = to + b;
    ctx.fillStyle = "rgba(230, 170, 110, 0.55)";
    ctx.beginPath();
    ctx.moveTo(x1, ground(x1));
    for (let x = x1; x <= x2; x += 6) ctx.lineTo(x, ground(x) - 3);
    ctx.lineTo(x2, ground(x2) + 6);
    ctx.lineTo(x1, ground(x1) + 6);
    ctx.fill();
    if (science && st.task === "drive") {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.fillText("SOFT SOIL", x1, ground(x1) + 22);
    }
  }

  // Landing zone
  ctx.fillStyle = "rgba(74, 222, 128, 0.25)";
  ctx.fillRect(from, ground(from) - 4, to - from, 8);
  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(from, ground(from) - 130);
  ctx.lineTo(from, ground(from));
  ctx.moveTo(to, ground(to) - 130);
  ctx.lineTo(to, ground(to));
  ctx.stroke();
  ctx.setLineDash([]);
  const mid = (from + to) / 2;
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(mid - 1, ground(mid) - 46, 2, 46);
  ctx.beginPath();
  ctx.moveTo(mid + 1, ground(mid) - 46);
  ctx.lineTo(mid + 22, ground(mid) - 39);
  ctx.lineTo(mid + 1, ground(mid) - 32);
  ctx.fill();
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillText(`${st.mission.site.toUpperCase()} · LANDING ZONE`, from + 8, ground(from) - 140);

  // Boulders in the landing zone
  for (const r of st.rocks) {
    const gy = ground(r);
    ctx.fillStyle = "#6e3b2c";
    ctx.beginPath();
    ctx.ellipse(r, gy - 6, 14, 11, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.ellipse(r - 4, gy - 11, 5, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Target rock for rover missions
  if (st.task === "drive" && (science || phase === "ready")) {
    const gx = s.target;
    const gy = ground(gx);
    ctx.fillStyle = "#8a4a33";
    ctx.beginPath();
    ctx.ellipse(gx + 18, gy - 7, 12, 10, 0, Math.PI, 0);
    ctx.fill();
    if (science) {
      ctx.strokeStyle = `rgba(61,214,245,${0.6 + 0.4 * Math.sin(t / 150)})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(gx - 14, gy - 30, 28, 30);
      ctx.setLineDash([]);
      ctx.fillStyle = "#3dd6f5";
      ctx.font = "700 11px system-ui, sans-serif";
      ctx.fillText("STOP HERE", gx - 28, gy - 38);
    }
  }

  // Rocket (flies left to right)
  if (!science || s.rocket.x < cam + W + 100) {
    ctx.save();
    ctx.translate(s.rocket.x, s.rocket.y);
    const flame = 14 + Math.sin(t / 35) * 5;
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.moveTo(-38, -6); ctx.lineTo(-38 - flame, 0); ctx.lineTo(-38, 6); ctx.fill();
    ctx.fillStyle = "#e8ebf6";
    ctx.beginPath();
    ctx.moveTo(42, 0);
    ctx.quadraticCurveTo(30, -14, 0, -13);
    ctx.lineTo(-38, -13); ctx.lineTo(-38, 13); ctx.lineTo(0, 13);
    ctx.quadraticCurveTo(30, 14, 42, 0);
    ctx.fill();
    ctx.fillStyle = "#7b5cff";
    ctx.fillRect(-36, -20, 12, 7);
    ctx.fillRect(-36, 13, 12, 7);
    ctx.fillStyle = "#3dd6f5";
    ctx.beginPath(); ctx.arc(18, -2, 5, 0, Math.PI * 2); ctx.fill();
    if (phase === "flight" || phase === "ready") {
      ctx.fillStyle = "#c9cfe6";
      ctx.beginPath(); ctx.moveTo(-10, 13); ctx.lineTo(10, 13); ctx.lineTo(0, 30); ctx.fill();
    }
    ctx.restore();
  }

  // Lander + parachute
  if (phase === "fall" || phase === "crashed" || science) {
    const L = s.lander;
    if (s.chute && phase === "fall") {
      const open = s.chuteT;
      const r = 8 + 26 * open;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(L.x - 8, L.y - 10); ctx.lineTo(L.x - r, L.y - 46);
      ctx.moveTo(L.x + 8, L.y - 10); ctx.lineTo(L.x + r, L.y - 46);
      ctx.stroke();
      ctx.fillStyle = "#ff6fb5";
      ctx.beginPath();
      ctx.ellipse(L.x, L.y - 46, r, 10 + 12 * open, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(L.x - 2, L.y - 58 - 10 * open, 4, 10 + 12 * open);
    }
    const broken = phase === "crashed";
    ctx.fillStyle = broken ? "#6b6f84" : "#c9cfe6";
    ctx.beginPath();
    ctx.moveTo(L.x - 16, L.y + 16); ctx.lineTo(L.x + 16, L.y + 16); ctx.lineTo(L.x, L.y - 12); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3dd6f5";
    ctx.fillRect(L.x - 3, L.y + 2, 6, 4);

    // Lander science: robot arm to the ground (scoop) or a dome placed beside it (seismometer)
    if (science && st.task !== "drive") {
      const gy = ground(L.x + 40);
      const reach = phase === "done" ? 1 : 0.4 + 0.15 * Math.sin(t / 300);
      ctx.strokeStyle = "#e8ebf6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(L.x + 10, L.y + 4);
      ctx.lineTo(L.x + 28, L.y - 10);
      ctx.lineTo(L.x + 40, L.y + 4 + (gy - L.y - 10) * reach);
      ctx.stroke();
      if (st.task === "seismo" && phase === "done") {
        ctx.fillStyle = "#e8ebf6";
        ctx.beginPath();
        ctx.ellipse(L.x + 44, gy - 1, 10, 9, 0, Math.PI, 0);
        ctx.fill();
      }
    }

    // Rover rolls off the lander and drives
    if (science && st.task === "drive") {
      const rx = s.rover.x;
      const gy = ground(rx);
      ctx.fillStyle = "#e8ebf6";
      ctx.fillRect(rx - 10, gy - 14, 20, 7);
      ctx.fillStyle = "#3dd6f5";
      ctx.fillRect(rx - 12, gy - 18, 24, 3);
      ctx.fillStyle = "#151b3d";
      const spin = s.rover.x / 4;
      for (const dx of [-8, 0, 8]) {
        ctx.beginPath(); ctx.arc(rx + dx, gy - 4, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#6b6f84";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(rx + dx, gy - 4); ctx.lineTo(rx + dx + Math.cos(spin) * 3, gy - 4 + Math.sin(spin) * 3); ctx.stroke();
      }
      if (s.rover.analyze > 0) {
        ctx.strokeStyle = "#3dd6f5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx + 10, gy - 12);
        ctx.lineTo(rx + 22, gy - 8);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // Timing meter for lander science
  if (phase === "science" && st.task !== "drive") {
    const bw = 420, bx = (W - bw) / 2, by = 60;
    const win = st.window ?? 0.15;
    ctx.fillStyle = "rgba(11,16,38,0.8)";
    ctx.fillRect(bx - 16, by - 34, bw + 32, 74);
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText(st.task === "scoop" ? "Press when the needle is in the green: scoop the soil" : "Press when the needle is in the green: place the seismometer", bx, by - 12);
    ctx.fillStyle = "#323b73";
    ctx.fillRect(bx, by, bw, 18);
    ctx.fillStyle = s.missFlash > 0 ? "#ff6b81" : "#4ade80";
    ctx.fillRect(bx + bw * (0.5 - win / 2), by, bw * win, 18);
    const pos = 0.5 + 0.5 * Math.sin(s.needle);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(bx + bw * pos - 2, by - 5, 4, 28);
  }

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 12px system-ui, sans-serif";
  if (phase === "flight") ctx.fillText("Release before the zone: the lander keeps moving forward", 16, 28);
  if (phase === "science" && st.task === "drive") ctx.fillText("Hold → to drive, let go to stop. Stop on the target rock to analyze it.", 16, 28);
}
