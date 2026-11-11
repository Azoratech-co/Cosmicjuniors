"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { WinPanel } from "./GameShell";
import { Chevron } from "./Chevron";
import { addStars } from "@/lib/stars";
import { CRUISES, loadJSON, saveJSON } from "@/lib/missions";
import { cloud, craft, debris, loadImage, mix, rocket, rockShape, spaceRock, type RocketState } from "./art";

// Journey to Mars: launch the real rocket from Cape Canaveral (Delta II or Atlas V), stay on the
// flight path and separate each stage on time, then cruise to Mars dodging meteoroids (space rocks)
// and catching science data that unlocks real mission facts for the Mission Log.

const W = 480;
const H = 640;
const SHIELDS = 3;
const SAVE_KEY = "cj-journey";
const ASCENT_TIME = 20; // seconds from liftoff to spacecraft separation
const COUNTDOWN = 3;
const S = 1.35; // rocket drawing scale

type Status = "ready" | "playing" | "paused" | "won" | "lost";
type Phase = "countdown" | "ascent" | "cruise";
type StageEvent = "boosters" | "fairing" | "firstStage" | "spacecraft";

const EVENTS: { at: number; kind: StageEvent; label: string; prompt: string }[] = [
  { at: 0.26, kind: "boosters", label: "Separate boosters", prompt: "Boosters are empty: separate them" },
  { at: 0.5, kind: "fairing", label: "Drop the fairing", prompt: "Above the thick air: drop the nose fairing" },
  { at: 0.72, kind: "firstStage", label: "Separate stage 1", prompt: "Main engine cut off: separate the first stage" },
  { at: 0.97, kind: "spacecraft", label: "Release spacecraft", prompt: "On the way to Mars: release the spacecraft" },
];

interface Rock { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; shape: number[]; tone: number }
interface Pickup { kind: "data" | "shield"; x: number; y: number; vy: number; fact: number }
interface Star { x: number; y: number; s: number; v: number; a: number }
interface Puff { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number }
interface Piece { kind: "booster" | "fairing" | "stage"; x: number; y: number; vx: number; vy: number; rot: number; vr: number; side: number }
interface Cloud { x: number; y: number; w: number; seed: number }
interface Save { unlocked: number; found: Record<string, number[]> }

const EMPTY_SAVE: Save = { unlocked: 0, found: {} };
const stageName = (p: number) => (p < 0.2 ? "Leaving Earth" : p < 0.82 ? "Deep space" : "Mars approach");
const SHOWER = { from: 0.46, to: 0.56 };

export default function JourneyToMars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [phase, setPhase] = useState<Phase>("countdown");
  const [chapter, setChapter] = useState(0);
  const [save, setSave] = useState<Save>(EMPTY_SAVE);
  const [shields, setShields] = useState(SHIELDS);
  const [progress, setProgress] = useState(0);
  const [alt, setAlt] = useState(0);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [runFound, setRunFound] = useState<number[]>([]);
  const [result, setResult] = useState({ earned: 0, perfect: false, staged: 0, course: 0 });

  const cruise = CRUISES[chapter];
  const facts = cruise.mission.facts;

  const game = useRef({
    phase: "countdown" as Phase, clock: 0, kind: CRUISES[0].rocket,
    // launch
    alt: 0, rx: W / 2, ry: H - 68, rvx: 0, wind: 0, windT: 0, cam: 0, onCourse: 0, ascentT: 0,
    rs: { boosters: true, fairing: true, firstStage: true } as RocketState,
    event: 0, eventT: 0, staged: 0, puffs: [] as Puff[], pieces: [] as Piece[], clouds: [] as Cloud[], sepT: 0,
    // cruise
    x: W / 2, y: H - 120, inv: 0, hits: 0, progress: 0, spawn: 0, difficulty: 0, trip: 45,
    rocks: [] as Rock[], pickups: [] as Pickup[], stars: [] as Star[],
    queue: [] as { at: number; kind: Pickup["kind"]; fact: number }[], found: [] as number[], flash: 0, thrust: { x: 0, y: 0 },
    keys: new Set<string>(), target: null as { x: number; y: number } | null, pad: { x: 0, y: 0 },
  });
  const statusRef = useRef<Status>("ready");
  statusRef.current = status;
  const toastTimer = useRef(0);
  const images = useRef<{ earth?: HTMLImageElement; mars?: HTMLImageElement }>({});

  useEffect(() => {
    setSave(loadJSON(SAVE_KEY, EMPTY_SAVE));
    images.current = { earth: loadImage("/games/earth.webp"), mars: loadImage("/games/mars.webp") };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __journey: unknown }).__journey = game.current;
  }, []);

  const reset = useCallback((idx: number) => {
    const g = game.current;
    const c = CRUISES[idx];
    const n = c.mission.facts.length;
    const queue = [
      ...Array.from({ length: n }, (_, i) => ({ at: (i + 0.7) / (n + 0.4), kind: "data" as const, fact: i })),
      { at: 0.35, kind: "shield" as const, fact: -1 },
      { at: 0.7, kind: "shield" as const, fact: -1 },
    ].sort((a, b) => a.at - b.at);
    Object.assign(g, {
      phase: "countdown", clock: 0, kind: c.rocket,
      alt: 0, rx: W / 2, ry: H - 68, rvx: 0, wind: 0, windT: 1.5, cam: 0, onCourse: 0, ascentT: 0,
      rs: { boosters: true, fairing: true, firstStage: true }, event: 0, eventT: 0, staged: 0, puffs: [], pieces: [], sepT: 0,
      clouds: Array.from({ length: 9 }, (_, i) => ({ x: Math.random() * W, y: -260 - i * 340 - Math.random() * 120, w: 160 + Math.random() * 160, seed: Math.random() })),
      x: W / 2, y: H - 120, inv: 0, hits: 0, progress: 0, spawn: 1.4, difficulty: c.difficulty, trip: 42 + c.difficulty * 5,
      rocks: [], pickups: [], queue, found: [], flash: 0, target: null, thrust: { x: 0, y: 0 },
    });
    g.stars = Array.from({ length: 110 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() < 0.9 ? 1 : 1.6, v: Math.random() * 14 + 4, a: 0.25 + Math.random() * 0.6 }));
    setShields(SHIELDS);
    setProgress(0);
    setAlt(0);
    setPhase("countdown");
    setPrompt(null);
    setRunFound([]);
    setToast(null);
  }, []);

  useEffect(() => reset(0), [reset]);

  const begin = (idx = chapter) => {
    setChapter(idx);
    reset(idx);
    setStatus("playing");
  };

  const showFact = (text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  };

  const onFact = useRef<(i: number) => void>(() => {});
  onFact.current = (i: number) => {
    setRunFound((f) => (f.includes(i) ? f : [...f, i]));
    showFact(facts[i]);
    setSave((s) => {
      const id = cruise.mission.id;
      const had = s.found[id] ?? [];
      if (had.includes(i)) return s;
      const next = { ...s, found: { ...s.found, [id]: [...had, i].sort() } };
      saveJSON(SAVE_KEY, next);
      return next;
    });
  };

  const onWin = useRef<() => void>(() => {});
  onWin.current = () => {
    const g = game.current;
    const noHits = g.hits === 0;
    const course = g.ascentT ? g.onCourse / g.ascentT : 0;
    const earned = 3 + g.found.length + (noHits ? 2 : 0) + (g.staged === EVENTS.length ? 1 : 0) + (course > 0.8 ? 1 : 0);
    addStars(earned);
    setResult({ earned, perfect: noHits, staged: g.staged, course });
    setSave((s) => {
      const next = { ...s, unlocked: Math.max(s.unlocked, Math.min(CRUISES.length - 1, chapter + 1)) };
      saveJSON(SAVE_KEY, next);
      return next;
    });
    setStatus("won");
  };

  /** Separate the current stage (from the button, Space, or automatically when time runs out). */
  const stage = useRef<(byPlayer: boolean) => void>(() => {});
  stage.current = (byPlayer: boolean) => {
    const g = game.current;
    const ev = EVENTS[g.event];
    if (!ev || g.phase !== "ascent" || g.alt < ev.at) return;
    if (byPlayer) g.staged++;
    const { rx, ry, rvx } = g;
    if (ev.kind === "boosters") {
      g.rs.boosters = false;
      for (const s of [-1, 1]) g.pieces.push({ kind: "booster", x: rx + s * 14 * S, y: ry - 26 * S, vx: s * 30 + rvx, vy: 60, rot: 0, vr: s * 0.9, side: s });
    } else if (ev.kind === "fairing") {
      g.rs.fairing = false;
      const top = ry - (g.kind === "atlas" ? 150 : 125) * S;
      for (const s of [-1, 1]) g.pieces.push({ kind: "fairing", x: rx + s * 6 * S, y: top, vx: s * 55 + rvx, vy: 40, rot: 0, vr: s * 1.4, side: s });
    } else if (ev.kind === "firstStage") {
      g.rs.firstStage = false;
      g.pieces.push({ kind: "stage", x: rx, y: ry - 30 * S, vx: rvx, vy: 70, rot: 0, vr: 0.25, side: 1 });
      g.ry -= (g.kind === "atlas" ? 86 : 80) * S;
    } else {
      g.sepT = 0.001;
    }
    g.event++;
    g.eventT = 0;
    setPrompt(null);
  };

  const action = () => {
    if (statusRef.current === "ready" || statusRef.current === "lost") begin();
    else if (statusRef.current === "playing" && game.current.phase === "ascent") stage.current(true);
  };

  useEffect(() => {
    const keys = game.current.keys;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(k)) e.preventDefault();
      if ((k === " " || k === "enter") && !e.repeat) action();
      else if (k === "p" || k === "escape") setStatus((s) => (s === "playing" ? "paused" : s === "paused" ? "playing" : s));
      else keys.add(k);
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter]);

  useEffect(() => {
    const onHide = () => document.hidden && setStatus((s) => (s === "playing" ? "paused" : s));
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

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
      const g = game.current;
      const playing = statusRef.current === "playing";

      let sx = g.pad.x, sy = g.pad.y;
      if (g.keys.has("arrowleft") || g.keys.has("a")) sx -= 1;
      if (g.keys.has("arrowright") || g.keys.has("d")) sx += 1;
      if (g.keys.has("arrowup") || g.keys.has("w")) sy -= 1;
      if (g.keys.has("arrowdown") || g.keys.has("s")) sy += 1;

      if (playing) {
        g.clock += dt;
        if (g.phase === "countdown") {
          // engines light at T-0.4 s; smoke billows out of the flame trench
          if (g.clock > COUNTDOWN - 0.4) emitPad(g, dt);
          if (g.clock >= COUNTDOWN) {
            g.phase = "ascent";
            setPhase("ascent");
          }
        } else if (g.phase === "ascent") {
          ascend(g, dt, sx);
          const ev = EVENTS[g.event];
          if (ev && g.alt >= ev.at) {
            if (g.eventT === 0) setPrompt(ev.label);
            g.eventT += dt;
            if (g.eventT > 3) stage.current(false);
          }
          if (g.sepT > 0) {
            g.sepT += dt;
            if (g.sepT > 2.2) {
              g.phase = "cruise";
              g.x = g.rx;
              g.y = H - 120;
              setPhase("cruise");
            }
          }
        } else {
          cruiseStep(g, dt, sx, sy, onFact.current, (left) => {
            setShields(left);
            if (left <= 0) setStatus("lost");
          });
          if (g.progress >= 1 && statusRef.current === "playing") {
            statusRef.current = "won";
            onWin.current();
          }
        }
        uiTick += dt;
        if (uiTick > 0.1) {
          uiTick = 0;
          setProgress(g.progress);
          setAlt(g.alt);
        }
      }

      // stars always drift a little
      const drift = g.phase === "cruise" && playing ? 1 : 0.15;
      for (const s of g.stars) {
        s.y += s.v * dt * drift;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      }
      // smoke and falling pieces keep moving even before liftoff
      for (const p of g.puffs) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 0.6 * dt; p.r += 16 * dt; p.life += dt; }
      g.puffs = g.puffs.filter((p) => p.life < p.max && p.y < H + 80);

      if (g.phase === "cruise") drawCruise(ctx, g, t, playing, images.current);
      else drawLaunch(ctx, g, t, statusRef.current !== "ready");
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toLogical = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H - 40 };
  };
  const padHold = (x: number, y: number) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); game.current.pad = { x, y }; },
    onPointerUp: () => { game.current.pad = { x: 0, y: 0 }; },
    onPointerLeave: () => { game.current.pad = { x: 0, y: 0 }; },
    onPointerCancel: () => { game.current.pad = { x: 0, y: 0 }; },
  });

  const day = Math.round(progress * cruise.days);
  const fmtDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const totalFound = CRUISES.reduce((n, c) => n + (save.found[c.mission.id]?.length ?? 0), 0);
  const totalFacts = CRUISES.reduce((n, c) => n + c.mission.facts.length, 0);
  const hasNext = chapter < CRUISES.length - 1;
  const launching = status === "playing" && phase !== "cruise";

  return (
    <div className="arcade">
      <div className="arcade-hud">
        {phase === "cruise" ? (
          <>
            <span className="t-label">
              Shields{" "}
              {Array.from({ length: SHIELDS }, (_, i) => (
                <span key={i} className={`pip${i < shields ? " is-on" : ""}`} aria-hidden="true" />
              ))}
              <span className="sr-only">{shields} of {SHIELDS}</span>
            </span>
            <span className="t-label">Day <b>{day}</b> <span className="c-muted">of {cruise.days}</span></span>
            <span className="t-label">Data <b>{runFound.length}/{facts.length}</b></span>
            <span className="trip" aria-label={`Trip ${Math.round(progress * 100)} percent`}>
              <span className="t-caption c-muted">Earth</span>
              <span className="trip__bar"><span style={{ width: `${progress * 100}%` }} /></span>
              <span className="t-caption c-muted">Mars</span>
            </span>
          </>
        ) : (
          <>
            <span className="t-label">{cruise.rocketName} · <span className="c-muted">Cape Canaveral, Florida</span></span>
            <span className="t-label">Altitude <b>{Math.round(alt * 190)} km</b></span>
            <span className="t-label c-muted">{fmtDate(cruise.launch)}</span>
          </>
        )}
        {status === "playing" && (
          <button className="btn-ghost t-label" onClick={() => setStatus("paused")}>Pause</button>
        )}
      </div>

      <div className="arcade-stage">
        <canvas
          ref={canvasRef}
          className="arcade-canvas"
          style={{ aspectRatio: `${W} / ${H}` }}
          onPointerDown={(e) => { game.current.target = toLogical(e); }}
          onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") game.current.target = toLogical(e); }}
          onPointerUp={() => { game.current.target = null; }}
          aria-label="Journey to Mars game area"
        />

        {toast && status === "playing" && (
          <div className="fact-toast" role="status">
            <span className="t-caption c-cyan">Science data · {cruise.mission.name}</span>
            <span className="t-body-sm">{toast}</span>
          </div>
        )}

        {status !== "playing" && status !== "won" && (
          <div className="stage-overlay">
            {status === "ready" && (
              <>
                <h2 className="t-title">Choose your mission</h2>
                <div className="chapter-list">
                  {CRUISES.map((c, i) => {
                    const locked = i > save.unlocked;
                    const got = save.found[c.mission.id]?.length ?? 0;
                    return (
                      <button key={c.mission.id} className={`chapter${i === chapter ? " is-on" : ""}`} disabled={locked} onClick={() => begin(i)}>
                        <span className="t-caption c-cyan">Chapter {i + 1}{locked ? " · Locked" : ""}</span>
                        <span className="t-label">{c.mission.name}</span>
                        <span className="t-caption c-muted">
                          {c.rocketName} · {fmtDate(c.launch)} · {c.days} days to Mars · {got}/{c.mission.facts.length} facts
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="t-caption c-muted hide-sm">Launch: ← → stay on the flight path, Space to separate stages · Cruise: arrow keys or drag · P to pause</p>
              </>
            )}
            {status === "paused" && (
              <>
                <h2 className="t-title">Paused</h2>
                <button className="btn-purple t-label" onClick={() => setStatus("playing")}>Resume</button>
                <button className="btn-ghost t-label" onClick={() => setStatus("ready")}>Choose another mission</button>
              </>
            )}
            {status === "lost" && (
              <>
                <h2 className="t-title">Shields down</h2>
                <p className="t-body-sm c-muted">
                  Your {cruise.mission.name} cruise ended on day {day} of {cruise.days}. The facts you caught are saved in your Mission Log.
                </p>
                <button className="btn-purple t-label" onClick={() => begin()}>Launch again</button>
                <button className="btn-ghost t-label" onClick={() => setStatus("ready")}>Choose another mission</button>
              </>
            )}
          </div>
        )}
      </div>

      {launching ? (
        <div className="landing-controls">
          <button className="pad-btn" aria-label="Steer left" {...padHold(-1, 0)}><Chevron dir="left" /></button>
          <button className="btn-purple t-label action-btn" onClick={action} disabled={!prompt}>
            {phase === "countdown" ? "Countdown…" : prompt ?? "Stay on the flight path"}
          </button>
          <button className="pad-btn" aria-label="Steer right" {...padHold(1, 0)}><Chevron dir="right" /></button>
        </div>
      ) : (
        <div className="arrow-pad" aria-label="Arrow controls">
          <button className="pad-up" aria-label="Up" {...padHold(0, -1)}><Chevron dir="up" /></button>
          <button className="pad-left" aria-label="Left" {...padHold(-1, 0)}><Chevron dir="left" /></button>
          <button className="pad-down" aria-label="Down" {...padHold(0, 1)}><Chevron dir="down" /></button>
          <button className="pad-right" aria-label="Right" {...padHold(1, 0)}><Chevron dir="right" /></button>
        </div>
      )}

      {status === "won" && (
        <WinPanel
          title={`${cruise.mission.name} reached Mars!`}
          stars={result.earned}
          sourceTitle={cruise.mission.source.title}
          sourceUrl={cruise.mission.source.url}
          onAgain={() => begin()}
          againLabel="Launch again"
          onNext={hasNext ? () => begin(chapter + 1) : undefined}
          nextLabel={hasNext ? `Chapter ${chapter + 2}: ${CRUISES[chapter + 1].mission.name}` : undefined}
          facts={[...runFound.map((i) => facts[i]), cruise.mission.epilogue]}
        >
          <p className="t-body-sm c-muted">
            {cruise.days}-day trip complete · {runFound.length} of {facts.length} science data caught · {result.staged} of {EVENTS.length} stages separated on time
            {result.perfect ? " · No hits!" : ""}
          </p>
          <p className="t-body-sm">
            Now land it: <Link href="/games/landing">play Mars Landing</Link>.
          </p>
        </WinPanel>
      )}

      <section className="mission-log" aria-label="Mission Log">
        <div className="mission-log__head">
          <h2 className="t-title">Mission Log</h2>
          <span className="t-label c-muted">{totalFound}/{totalFacts} facts found</span>
        </div>
        {CRUISES.map((c) => {
          const got = save.found[c.mission.id] ?? [];
          return (
            <div key={c.mission.id} className="log-mission">
              <span className="t-caption c-cyan">{c.mission.name} · {got.length}/{c.mission.facts.length}</span>
              {got.length > 0 && (
                <ul className="t-body-sm">
                  {got.map((i) => <li key={i}>{c.mission.facts[i]}</li>)}
                </ul>
              )}
              {got.length > 0 && (
                <a className="t-caption c-muted" href={c.mission.source.url} target="_blank" rel="noopener noreferrer">
                  Source: {c.mission.source.title} on NASA.gov
                </a>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

interface Game {
  phase: Phase; clock: number; kind: "delta" | "atlas";
  alt: number; rx: number; ry: number; rvx: number; wind: number; windT: number; cam: number; onCourse: number; ascentT: number;
  rs: RocketState; event: number; eventT: number; staged: number; puffs: Puff[]; pieces: Piece[]; clouds: Cloud[]; sepT: number;
  x: number; y: number; inv: number; hits: number; progress: number; spawn: number; difficulty: number; trip: number;
  rocks: Rock[]; pickups: Pickup[]; stars: Star[]; queue: { at: number; kind: Pickup["kind"]; fact: number }[]; found: number[];
  flash: number; thrust: { x: number; y: number }; target: { x: number; y: number } | null;
}

/** Smoke pours sideways out of the flame trench at ignition. */
function emitPad(g: Game, dt: number) {
  const n = Math.ceil(dt * 90);
  for (let i = 0; i < n; i++) {
    const s = Math.random() < 0.5 ? -1 : 1;
    g.puffs.push({ x: g.rx + s * (10 + Math.random() * 20), y: H - 70 + Math.random() * 10, vx: s * (60 + Math.random() * 120), vy: -10 - Math.random() * 25, r: 10 + Math.random() * 10, life: 0, max: 3 + Math.random() * 2 });
  }
}

function ascend(g: Game, dt: number, steer: number) {
  g.ascentT += dt;
  g.alt = Math.min(1, g.alt + dt / ASCENT_TIME);
  const a = g.alt;
  // climb: slow off the pad, then faster and faster
  const climb = 30 + 900 * a * a + 180 * a;
  const camTarget = H * 0.62;
  if (g.ry > camTarget && g.sepT === 0) g.ry -= climb * dt;
  else g.cam += climb * dt;
  const dCam = g.ry > camTarget ? 0 : climb * dt;

  // wind gusts push the rocket sideways in the lower atmosphere; steer to stay on the flight path
  g.windT -= dt;
  if (g.windT <= 0) {
    g.windT = 1.2 + Math.random() * 1.6;
    g.wind = (Math.random() * 2 - 1) * (30 + 40 * g.difficulty) * (a < 0.55 ? 1 : 0.4);
  }
  if (g.clock > COUNTDOWN + 1.2) {
    g.rvx += (g.wind * 0.9 + steer * 150) * dt;
    g.rvx *= 1 - 1.4 * dt;
    g.rx = Math.max(60, Math.min(W - 60, g.rx + g.rvx * dt));
  }
  if (Math.abs(g.rx - W / 2) < 34) g.onCourse += dt;

  // smoke trail in the thick lower air
  if (a < 0.45 && g.rs.firstStage) {
    const n = Math.ceil(dt * 60 * (1 - a * 2));
    for (let i = 0; i < n; i++) {
      g.puffs.push({ x: g.rx + (Math.random() - 0.5) * 10, y: g.ry + 40 * S + Math.random() * 20, vx: (Math.random() - 0.5) * 20, vy: 0, r: 6 + Math.random() * 6, life: 0, max: 2.5 + Math.random() });
    }
  }
  for (const p of g.puffs) p.y += dCam;
  for (const c of g.clouds) c.y += dCam * 0.9;
  for (const p of g.pieces) {
    p.vy += 40 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt + dCam;
    p.rot += p.vr * dt;
  }
  g.pieces = g.pieces.filter((p) => p.y < H + 120);
  if (g.sepT > 0) g.ry += 26 * dt; // the upper stage drifts away below the spacecraft
}

function cruiseStep(g: Game, dt: number, sx: number, sy: number, onFact: (i: number) => void, onHit: (left: number) => void) {
  const speed = 270;
  let dx = sx, dy = sy;
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    g.x += (dx / len) * speed * dt;
    g.y += (dy / len) * speed * dt;
  } else if (g.target) {
    const tx = g.target.x - g.x, ty = g.target.y - g.y;
    const d = Math.hypot(tx, ty);
    if (d > 2) {
      const step = Math.min(d, speed * 1.4 * dt);
      dx = tx / d;
      dy = ty / d;
      g.x += dx * step;
      g.y += dy * step;
    } else { dx = 0; dy = 0; }
  }
  g.thrust = { x: dx, y: dy };
  g.x = Math.max(26, Math.min(W - 26, g.x));
  g.y = Math.max(50, Math.min(H - 30, g.y));

  g.progress = Math.min(1, g.progress + dt / g.trip);
  g.inv = Math.max(0, g.inv - dt);
  g.flash = Math.max(0, g.flash - dt);
  const p = g.progress;
  const d = g.difficulty;
  const shower = p >= SHOWER.from && p <= SHOWER.to;

  g.spawn -= dt;
  if (g.spawn <= 0) {
    g.spawn = (1.0 - 0.5 * p) * (1 - 0.14 * d) * (shower ? 0.35 : 1) + Math.random() * 0.25;
    const n = shower ? 2 : p > 0.6 || d === 2 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const big = !shower && Math.random() < 0.3;
      const r = big ? 22 + Math.random() * 12 : 8 + Math.random() * 8;
      const tilt = shower ? 110 + d * 20 : 50 + d * 30;
      g.rocks.push({
        x: 20 + Math.random() * (W - 40), y: -r - 10, vx: (Math.random() - 0.5) * tilt,
        vy: (big ? 110 : 190) + p * 170 + d * 40 + Math.random() * 50,
        r, rot: Math.random() * 6, vr: (Math.random() - 0.5) * (big ? 0.8 : 2.5), shape: rockShape(), tone: Math.random(),
      });
    }
  }

  while (g.queue.length && g.queue[0].at <= p) {
    const q = g.queue.shift()!;
    g.pickups.push({ kind: q.kind, fact: q.fact, x: 40 + Math.random() * (W - 80), y: -20, vy: 115 + d * 15 });
  }

  for (const r of g.rocks) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; }
  g.rocks = g.rocks.filter((r) => r.y < H + 40 && r.x > -40 && r.x < W + 40);
  for (const k of g.pickups) k.y += k.vy * dt;

  g.pickups = g.pickups.filter((k) => {
    if (Math.hypot(k.x - g.x, k.y - g.y) < 28) {
      if (k.kind === "data") {
        if (!g.found.includes(k.fact)) g.found.push(k.fact);
        onFact(k.fact);
      } else {
        g.hits = Math.max(0, g.hits - 1);
        onHit(SHIELDS - g.hits);
        g.flash = 0.4;
      }
      return false;
    }
    return k.y < H + 30;
  });

  if (g.inv <= 0 && g.rocks.some((r) => Math.hypot(r.x - g.x, r.y - g.y) < r.r * 0.82 + 13)) {
    g.hits++;
    g.inv = 1.3;
    onHit(SHIELDS - g.hits);
  }
}

// ---------------------------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------------------------

function drawLaunch(ctx: CanvasRenderingContext2D, g: Game, t: number, started: boolean) {
  const a = g.alt;
  // sky: Florida blue, darker with height, black in space
  const top = a < 0.5 ? mix("4f88c6", "0d1f45", a / 0.5) : mix("0d1f45", "000000", (a - 0.5) / 0.35);
  const bottom = a < 0.5 ? mix("b9d5ee", "2a5a9a", a / 0.5) : mix("2a5a9a", "05070d", (a - 0.5) / 0.4);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, top);
  sky.addColorStop(1, bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const starA = Math.max(0, Math.min(1, (a - 0.45) / 0.3));
  if (starA > 0) {
    for (const s of g.stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.a * starA})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
  }

  // Earth's curve appears below as we reach space
  if (a > 0.55) {
    const k = Math.min(1, (a - 0.55) / 0.4);
    const R = 1400;
    const cy = H + R - 40 - k * 60;
    const eg = ctx.createRadialGradient(W / 2, cy, R - 120, W / 2, cy, R);
    eg.addColorStop(0, "#1c3f78");
    eg.addColorStop(0.9, "#3f7cc0");
    eg.addColorStop(1, "#9fd0f5");
    ctx.globalAlpha = k;
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(W / 2, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(170,215,255,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(W / 2, cy, R + 2, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ground: Cape Canaveral pad, scrub land and the Atlantic
  const gy = H - 60 + g.cam;
  if (gy < H + 10) {
    ctx.fillStyle = "#4f7da3";
    ctx.fillRect(0, gy - 26, W, 14);
    ctx.fillStyle = "#6c7a4f";
    ctx.fillRect(0, gy - 12, W, 12);
    ctx.fillStyle = "#8a8f7a";
    ctx.fillRect(0, gy, W, H - gy + 10);
    ctx.fillStyle = "#b9b6aa";
    ctx.fillRect(W / 2 - 70, gy - 4, 140, 8);
    // launch tower
    const tx = W / 2 + 40;
    ctx.fillStyle = "#7d7f84";
    ctx.fillRect(tx, gy - 215, 16, 215);
    ctx.strokeStyle = "#5a5c61";
    ctx.lineWidth = 1;
    for (let y = gy - 215; y < gy; y += 12) {
      ctx.beginPath();
      ctx.moveTo(tx, y); ctx.lineTo(tx + 16, y + 12);
      ctx.moveTo(tx + 16, y); ctx.lineTo(tx, y + 12);
      ctx.stroke();
    }
    ctx.fillStyle = "#9b2b25";
    ctx.fillRect(tx - 2, gy - 221, 20, 6);
    // lightning masts
    ctx.fillStyle = "#6a6c70";
    ctx.fillRect(W / 2 - 150, gy - 230, 4, 230);
    ctx.fillRect(W / 2 + 150, gy - 230, 4, 230);
  }

  for (const c of g.clouds) if (c.y > -120 && c.y < H + 120) cloud(ctx, c.x, c.y, c.w, Math.max(0, 0.9 - a * 1.6), c.seed);

  drawPuffs(ctx, g);

  for (const p of g.pieces) debris(ctx, p.kind, p.x, p.y, p.rot, p.side, g.kind, S);

  // the rocket (or the upper stage drifting away after separation)
  const firing = g.phase === "ascent" || (g.phase === "countdown" && g.clock > COUNTDOWN - 0.4);
  const vacuum = Math.max(0, Math.min(1, (a - 0.35) / 0.4));
  ctx.save();
  ctx.translate(g.rx, g.ry);
  ctx.rotate(g.rvx * 0.0016);
  ctx.scale(S, S);
  if (g.sepT > 0) {
    rocket(ctx, g.kind, { boosters: false, fairing: false, firstStage: false }, 0, 0, t, false, 1);
  } else {
    rocket(ctx, g.kind, g.rs, 0, 0, t, firing, vacuum);
  }
  ctx.restore();
  if (g.sepT > 0) {
    // the spacecraft pulls ahead of the spent upper stage
    craft(ctx, g.rx, g.ry - ((g.kind === "atlas" ? 70 : 55) + g.sepT * 40) * S, (0.6 + g.sepT * 0.2) * S);
  }

  // flight path guide
  if (g.phase === "ascent" && g.sepT === 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([6, 10]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2, 40);
    ctx.lineTo(W / 2, H - 40);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.fillText("FLIGHT PATH", W / 2 + 8, 52);
    const off = Math.abs(g.rx - W / 2) > 34;
    if (off) {
      ctx.fillStyle = "#ffd27a";
      ctx.font = "700 13px system-ui, sans-serif";
      const m = g.rx < W / 2 ? "Off course: steer right" : "Off course: steer left";
      ctx.fillText(m, (W - ctx.measureText(m).width) / 2, H - 22);
    }
  }

  // countdown and stage prompts
  ctx.textAlign = "center";
  if (started && g.phase === "countdown") {
    const n = Math.ceil(COUNTDOWN - g.clock);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "800 64px system-ui, sans-serif";
    ctx.fillText(n > 0 ? `T-${n}` : "Liftoff!", W / 2, 150);
  } else if (g.phase === "ascent" && g.clock < COUNTDOWN + 1.5) {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "800 44px system-ui, sans-serif";
    ctx.fillText("Liftoff!", W / 2, 140);
  }
  const ev = EVENTS[g.event];
  if (g.phase === "ascent" && ev && g.alt >= ev.at) {
    ctx.fillStyle = "rgba(10,14,24,0.7)";
    const w = 360;
    ctx.fillRect((W - w) / 2, 70, w, 40);
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.fillText(ev.prompt, W / 2, 95);
    ctx.fillStyle = "#ffd27a";
    ctx.fillRect((W - w) / 2, 106, w * Math.max(0, 1 - g.eventT / 3), 4);
  }
  if (g.sepT > 0) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText("Spacecraft separation. Next stop: Mars", W / 2, 120);
  }
  ctx.textAlign = "start";
}

function drawPuffs(ctx: CanvasRenderingContext2D, g: Game) {
  for (const p of g.puffs) {
    const k = p.life / p.max;
    const alpha = (1 - k) * 0.55;
    const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    gr.addColorStop(0, `rgba(238,236,232,${alpha})`);
    gr.addColorStop(1, "rgba(220,218,214,0)");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlanet(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, x: number, y: number, r: number, fallback: [string, string]) {
  if (img && img.complete && img.naturalWidth) {
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  } else {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, fallback[0]);
    g.addColorStop(1, fallback[1]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // night side shading, so the globes look lit by the Sun
  const sh = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  sh.addColorStop(0.45, "rgba(0,0,0,0)");
  sh.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCruise(ctx: CanvasRenderingContext2D, g: Game, t: number, playing: boolean, img: { earth?: HTMLImageElement; mars?: HTMLImageElement }) {
  const p = g.progress;
  const shower = playing && p >= SHOWER.from && p <= SHOWER.to;
  ctx.fillStyle = "#020309";
  ctx.fillRect(0, 0, W, H);
  for (const s of g.stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }

  // Earth falls behind, Mars grows ahead (real NASA photos)
  if (p < 0.3) {
    const r = 210 * (1 - p * 2.6) + 20;
    drawPlanet(ctx, img.earth, W * 0.28, H + 40 + p * 600, r, ["#6fa5d8", "#1f4f8f"]);
  }
  const mr = 16 + p * p * 230;
  const my = -mr + 46 + p * (mr + 20);
  drawPlanet(ctx, img.mars, W * 0.64, my, mr, ["#d9895a", "#7a2e17"]);

  if (playing) {
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(stageName(p).toUpperCase(), 14, 24);
    if (shower || (p > SHOWER.from - 0.05 && p < SHOWER.from)) {
      ctx.fillStyle = "#ffd27a";
      ctx.font = "700 13px system-ui, sans-serif";
      const msg = shower ? "METEOROID SHOWER" : "METEOROID SHOWER AHEAD";
      ctx.fillText(msg, W - ctx.measureText(msg).width - 14, 24);
    }
  }

  for (const r of g.rocks) spaceRock(ctx, r.x, r.y, r.r, r.rot, r.shape, r.tone);

  // pickups: science data (gold signal disc) and repair kits (white)
  for (const k of g.pickups) {
    ctx.save();
    ctx.translate(k.x, k.y);
    if (k.kind === "data") {
      ctx.fillStyle = "#e8c47a";
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(232,196,122,0.7)";
      ctx.lineWidth = 2;
      for (const rr of [14, 19]) {
        ctx.beginPath();
        ctx.arc(0, 0, rr + Math.sin(t / 200) * 1.5, -0.9, 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, rr + Math.sin(t / 200) * 1.5, Math.PI - 0.9, Math.PI + 0.9);
        ctx.stroke();
      }
      ctx.fillStyle = "#e8c47a";
      ctx.font = "800 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("DATA", 0, 28);
      ctx.textAlign = "start";
    } else {
      ctx.fillStyle = "#f2f2ef";
      ctx.beginPath();
      ctx.roundRect(-10, -10, 20, 20, 4);
      ctx.fill();
      ctx.fillStyle = "#b8352b";
      ctx.fillRect(-2, -6, 4, 12);
      ctx.fillRect(-6, -2, 12, 4);
    }
    ctx.restore();
  }

  // spacecraft (blinks while shields recharge), with small thruster puffs when it moves
  if (g.inv > 0 && Math.floor(t / 90) % 2 === 0) return;
  if (g.flash > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${g.flash * 1.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 30, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (g.thrust.x || g.thrust.y) {
    ctx.fillStyle = "rgba(230,235,245,0.7)";
    for (let i = 0; i < 3; i++) {
      const j = Math.random() * 6;
      ctx.beginPath();
      ctx.arc(g.x - g.thrust.x * (26 + j), g.y - g.thrust.y * (20 + j), 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  craft(ctx, g.x, g.y, 1.3);
}
