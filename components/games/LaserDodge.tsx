"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WinPanel } from "./GameShell";
import { addStars } from "@/lib/stars";
import { CRUISES, loadJSON, saveJSON } from "@/lib/missions";

// Journey to Mars: fly three real NASA cruises from Earth to Mars (Pathfinder, Spirit,
// Perseverance). Dodge laser bolts and beams, catch data capsules to unlock real mission
// facts for the Mission Log, and grab shield cells. Each chapter unlocks the next one.

const W = 480;
const H = 640;
const SHIELDS = 3;
const SAVE_KEY = "cj-journey";

type Status = "ready" | "playing" | "paused" | "won" | "lost";

interface Bolt { x: number; y: number; vx: number; vy: number }
interface Beam { dir: "h" | "v"; pos: number; t: number; warn: number; fire: number }
interface Pickup { kind: "data" | "shield"; x: number; y: number; vy: number; fact: number }
interface Star { x: number; y: number; s: number; v: number }
interface Save { unlocked: number; found: Record<string, number[]> }

const EMPTY_SAVE: Save = { unlocked: 0, found: {} };

const stageName = (p: number) => (p < 0.2 ? "Leaving Earth" : p < 0.82 ? "Deep space" : "Mars approach");
// A short burst of extra lasers in the middle of every cruise.
const STORM = { from: 0.46, to: 0.56 };

export default function LaserDodge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [chapter, setChapter] = useState(0);
  const [save, setSave] = useState<Save>(EMPTY_SAVE);
  const [shields, setShields] = useState(SHIELDS);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [runFound, setRunFound] = useState<number[]>([]);
  const [earned, setEarned] = useState(0);
  const [perfect, setPerfect] = useState(false);

  const cruise = CRUISES[chapter];
  const facts = cruise.mission.facts;

  const game = useRef({
    x: W / 2, y: H - 110, inv: 0, hits: 0, progress: 0, spawn: 0, difficulty: 0, trip: 45,
    bolts: [] as Bolt[], beams: [] as Beam[], pickups: [] as Pickup[], stars: [] as Star[],
    queue: [] as { at: number; kind: Pickup["kind"]; fact: number }[], found: [] as number[], flash: 0,
    keys: new Set<string>(), target: null as { x: number; y: number } | null, pad: { x: 0, y: 0 },
  });
  const statusRef = useRef<Status>("ready");
  statusRef.current = status;
  const toastTimer = useRef(0);

  useEffect(() => setSave(loadJSON(SAVE_KEY, EMPTY_SAVE)), []);

  // Expose the game state for automated play-tests (development only).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __journey: unknown }).__journey = game.current;
  }, []);

  const reset = useCallback((idx: number) => {
    const g = game.current;
    const c = CRUISES[idx];
    const n = c.mission.facts.length;
    // Data capsules are spread evenly along the trip; shield cells come at 35% and 70%.
    const queue = [
      ...Array.from({ length: n }, (_, i) => ({ at: (i + 0.7) / (n + 0.4), kind: "data" as const, fact: i })),
      { at: 0.35, kind: "shield" as const, fact: -1 },
      { at: 0.7, kind: "shield" as const, fact: -1 },
    ].sort((a, b) => a.at - b.at);
    Object.assign(g, {
      x: W / 2, y: H - 110, inv: 0, hits: 0, progress: 0, spawn: 1.2, difficulty: c.difficulty, trip: 45 + c.difficulty * 5,
      bolts: [], beams: [], pickups: [], queue, found: [], flash: 0, target: null,
    });
    g.stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.6 + 0.4, v: Math.random() * 60 + 30 }));
    setShields(SHIELDS);
    setProgress(0);
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

  // Called from the game loop when a data capsule is caught.
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
    const stars = 3 + g.found.length + (noHits ? 2 : 0);
    addStars(stars);
    setEarned(stars);
    setPerfect(noHits);
    setSave((s) => {
      const next = { ...s, unlocked: Math.max(s.unlocked, Math.min(CRUISES.length - 1, chapter + 1)) };
      saveJSON(SAVE_KEY, next);
      return next;
    });
    setStatus("won");
  };

  // Keyboard
  useEffect(() => {
    const keys = game.current.keys;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(k)) e.preventDefault();
      if ((k === " " || k === "enter") && (statusRef.current === "ready" || statusRef.current === "lost")) begin();
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

  // Pause when the tab is hidden
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

      if (playing) {
        // Move ship
        const speed = 280;
        let dx = 0, dy = 0;
        if (g.keys.has("arrowleft") || g.keys.has("a")) dx -= 1;
        if (g.keys.has("arrowright") || g.keys.has("d")) dx += 1;
        if (g.keys.has("arrowup") || g.keys.has("w")) dy -= 1;
        if (g.keys.has("arrowdown") || g.keys.has("s")) dy += 1;
        dx += g.pad.x;
        dy += g.pad.y;
        if (dx || dy) {
          const len = Math.hypot(dx, dy) || 1;
          g.x += (dx / len) * speed * dt;
          g.y += (dy / len) * speed * dt;
        } else if (g.target) {
          const tx = g.target.x - g.x, ty = g.target.y - g.y;
          const d = Math.hypot(tx, ty);
          if (d > 2) {
            const step = Math.min(d, speed * 1.4 * dt);
            g.x += (tx / d) * step;
            g.y += (ty / d) * step;
          }
        }
        g.x = Math.max(20, Math.min(W - 20, g.x));
        g.y = Math.max(40, Math.min(H - 30, g.y));

        g.progress = Math.min(1, g.progress + dt / g.trip);
        g.inv = Math.max(0, g.inv - dt);
        g.flash = Math.max(0, g.flash - dt);
        const p = g.progress;
        const d = g.difficulty;
        const storm = p >= STORM.from && p <= STORM.to;

        // Lasers: more often as Mars gets closer, in later chapters, and during the storm
        g.spawn -= dt;
        if (g.spawn <= 0) {
          g.spawn = (1.1 - 0.6 * p) * (1 - 0.14 * d) * (storm ? 0.45 : 1) + Math.random() * 0.25;
          if (storm || Math.random() < 0.62 - 0.12 * p) {
            const n = p > 0.6 || d === 2 ? 2 : 1;
            for (let i = 0; i < n; i++) {
              const tilt = storm ? 120 + d * 20 : 80 + d * 50;
              g.bolts.push({ x: 20 + Math.random() * (W - 40), y: -20, vx: (Math.random() - 0.5) * tilt, vy: 230 + p * 220 + d * 45 + Math.random() * 60 });
            }
          } else {
            const dir = Math.random() < 0.6 ? "h" : "v";
            g.beams.push({ dir, pos: dir === "h" ? 80 + Math.random() * (H - 140) : 30 + Math.random() * (W - 60), t: 0, warn: 1.05 - 0.3 * p - 0.1 * d, fire: 0.35 });
          }
        }

        // Data capsules and shield cells drift down at their point in the trip
        while (g.queue.length && g.queue[0].at <= p) {
          const q = g.queue.shift()!;
          g.pickups.push({ kind: q.kind, fact: q.fact, x: 40 + Math.random() * (W - 80), y: -20, vy: 120 + d * 15 });
        }

        for (const b of g.bolts) { b.x += b.vx * dt; b.y += b.vy * dt; }
        g.bolts = g.bolts.filter((b) => b.y < H + 30 && b.x > -30 && b.x < W + 30);
        for (const b of g.beams) b.t += dt;
        g.beams = g.beams.filter((b) => b.t < b.warn + b.fire);
        for (const k of g.pickups) k.y += k.vy * dt;

        // Pick-ups
        g.pickups = g.pickups.filter((k) => {
          if (Math.hypot(k.x - g.x, k.y - g.y) < 26) {
            if (k.kind === "data") {
              if (!g.found.includes(k.fact)) g.found.push(k.fact);
              onFact.current(k.fact);
            } else {
              g.hits = Math.max(0, g.hits - 1);
              setShields(SHIELDS - g.hits);
              g.flash = 0.4;
            }
            return false;
          }
          return k.y < H + 30;
        });

        // Collisions
        if (g.inv <= 0) {
          const r = 12;
          const hitBolt = g.bolts.some((b) => {
            const len = Math.hypot(b.vx, b.vy) || 1;
            const x1 = b.x - (b.vx / len) * 18, y1 = b.y - (b.vy / len) * 18, x2 = b.x, y2 = b.y;
            const t2 = Math.max(0, Math.min(1, ((g.x - x1) * (x2 - x1) + (g.y - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2 || 1)));
            return Math.hypot(g.x - (x1 + t2 * (x2 - x1)), g.y - (y1 + t2 * (y2 - y1))) < r + 3;
          });
          const hitBeam = g.beams.some((b) => b.t >= b.warn && Math.abs((b.dir === "h" ? g.y : g.x) - b.pos) < r + 5);
          if (hitBolt || hitBeam) {
            g.hits++;
            g.inv = 1.3;
            const left = SHIELDS - g.hits;
            setShields(left);
            if (left <= 0) setStatus("lost");
          }
        }

        if (g.progress >= 1 && statusRef.current === "playing") {
          statusRef.current = "won";
          onWin.current();
        }
        uiTick += dt;
        if (uiTick > 0.1) { uiTick = 0; setProgress(g.progress); }
      }

      // Background stars always drift
      const drift = statusRef.current === "playing" ? 1 : 0.25;
      for (const s of g.stars) {
        s.y += s.v * dt * drift;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      }

      draw(ctx, g, t, statusRef.current === "playing");
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Touch / mouse drag steers toward the finger
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
  const fmtDate = (iso: string) =>
    new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  const totalFound = CRUISES.reduce((n, c) => n + (save.found[c.mission.id]?.length ?? 0), 0);
  const totalFacts = CRUISES.reduce((n, c) => n + c.mission.facts.length, 0);
  const hasNext = chapter < CRUISES.length - 1;

  return (
    <div className="arcade">
      <div className="arcade-hud">
        <span className="t-label">
          Shields{" "}
          {Array.from({ length: SHIELDS }, (_, i) => (
            <span key={i} className={`pip${i < shields ? " is-on" : ""}`} aria-hidden="true" />
          ))}
          <span className="sr-only">{shields} of {SHIELDS}</span>
        </span>
        <span className="t-label">
          Day <b>{day}</b> <span className="c-muted">of {cruise.days}</span>
        </span>
        <span className="t-label">
          Data <b>{runFound.length}/{facts.length}</b>
        </span>
        <span className="trip" aria-label={`Trip ${Math.round(progress * 100)} percent`}>
          <span className="t-caption c-muted">Earth</span>
          <span className="trip__bar"><span style={{ width: `${progress * 100}%` }} /></span>
          <span className="t-caption c-muted">Mars</span>
        </span>
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
            <span className="t-caption c-cyan">Data capsule · {cruise.mission.name}</span>
            <span className="t-body-sm">{toast}</span>
          </div>
        )}

        {status !== "playing" && status !== "won" && (
          <div className="stage-overlay">
            {status === "ready" && (
              <>
                <h2 className="t-title">Choose your cruise</h2>
                <div className="chapter-list">
                  {CRUISES.map((c, i) => {
                    const locked = i > save.unlocked;
                    const got = save.found[c.mission.id]?.length ?? 0;
                    return (
                      <button
                        key={c.mission.id}
                        className={`chapter${i === chapter ? " is-on" : ""}`}
                        disabled={locked}
                        onClick={() => begin(i)}
                      >
                        <span className="t-caption c-cyan">Chapter {i + 1}{locked ? " · Locked" : ""}</span>
                        <span className="t-label">{c.mission.name}</span>
                        <span className="t-caption c-muted">
                          {fmtDate(c.launch)} → {fmtDate(c.land)} · {c.days} days · {got}/{c.mission.facts.length} facts
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="t-caption c-muted hide-sm">Arrow keys or WASD · Drag on touch screens · P to pause</p>
              </>
            )}
            {status === "paused" && (
              <>
                <h2 className="t-title">Paused</h2>
                <p className="t-body-sm c-muted">{cruise.mission.name} cruise · day {day} of {cruise.days}</p>
                <button className="btn-purple t-label" onClick={() => setStatus("playing")}>Resume</button>
                <button className="btn-ghost t-label" onClick={() => setStatus("ready")}>Choose another cruise</button>
              </>
            )}
            {status === "lost" && (
              <>
                <h2 className="t-title">Shields down</h2>
                <p className="t-body-sm c-muted">
                  Your {cruise.mission.name} cruise ended on day {day} of {cruise.days}. The facts you caught are saved in your Mission Log.
                </p>
                <button className="btn-purple t-label" onClick={() => begin()}>Try again</button>
                <button className="btn-ghost t-label" onClick={() => setStatus("ready")}>Choose another cruise</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="arrow-pad" aria-label="Arrow controls">
        <button className="pad-up" aria-label="Up" {...padHold(0, -1)}>▲</button>
        <button className="pad-left" aria-label="Left" {...padHold(-1, 0)}>◀</button>
        <button className="pad-down" aria-label="Down" {...padHold(0, 1)}>▼</button>
        <button className="pad-right" aria-label="Right" {...padHold(1, 0)}>▶</button>
      </div>

      {status === "won" && (
        <WinPanel
          title={`${cruise.mission.name} reached Mars!`}
          stars={earned}
          sourceTitle={cruise.mission.source.title}
          sourceUrl={cruise.mission.source.url}
          onAgain={() => begin()}
          againLabel="Fly again"
          onNext={hasNext ? () => begin(chapter + 1) : undefined}
          nextLabel={hasNext ? `Chapter ${chapter + 2}: ${CRUISES[chapter + 1].mission.name}` : undefined}
          facts={[...runFound.map((i) => facts[i]), cruise.mission.epilogue]}
        >
          <p className="t-body-sm c-muted">
            {cruise.days}-day cruise complete · {runFound.length} of {facts.length} data capsules caught
            {perfect ? " · Perfect flight, no hits!" : ""}
            {runFound.length < facts.length ? ". Fly again to find the rest." : "."}
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
              <span className="t-caption c-cyan">
                {c.mission.name} · {got.length}/{c.mission.facts.length}
              </span>
              {got.length > 0 && (
                <ul className="t-body-sm">
                  {got.map((i) => (
                    <li key={i}>{c.mission.facts[i]}</li>
                  ))}
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

function draw(ctx: CanvasRenderingContext2D, g: {
  x: number; y: number; inv: number; progress: number; flash: number; difficulty: number;
  bolts: Bolt[]; beams: Beam[]; pickups: Pickup[]; stars: Star[];
}, t: number, playing: boolean) {
  const p = g.progress;
  const storm = playing && p >= STORM.from && p <= STORM.to;

  // Space
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, storm ? "#3a1240" : "#1a1245");
  sky.addColorStop(1, "#0b1026");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  for (const s of g.stars) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + s.s / 3})`;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }

  // Earth falls behind, Mars grows ahead
  if (p < 0.25) {
    const ey = H + 120 + p * 900;
    const eg = ctx.createRadialGradient(W * 0.3, ey - 60, 10, W * 0.3, ey, 220);
    eg.addColorStop(0, "#6fd3ff");
    eg.addColorStop(1, "#1f5fbf");
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(W * 0.3, ey, 200, 0, Math.PI * 2);
    ctx.fill();
  }
  const mr = 18 + p * p * 210;
  const my = -mr + 40 + p * (mr + 30);
  const mg = ctx.createRadialGradient(W * 0.62 - mr * 0.3, my - mr * 0.3, mr * 0.1, W * 0.62, my, mr);
  mg.addColorStop(0, "#ffa36c");
  mg.addColorStop(1, "#a8341a");
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(W * 0.62, my, mr, 0, Math.PI * 2);
  ctx.fill();

  // Stage label and storm warning
  if (playing) {
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(stageName(p).toUpperCase(), 14, 24);
    if (storm || (p > STORM.from - 0.04 && p < STORM.from)) {
      ctx.fillStyle = `rgba(255,209,102,${0.6 + 0.4 * Math.sin(t / 120)})`;
      ctx.font = "700 14px system-ui, sans-serif";
      const msg = storm ? "LASER STORM · HOLD ON!" : "LASER STORM AHEAD";
      ctx.fillText(msg, W - ctx.measureText(msg).width - 14, 24);
    }
  }

  // Beams: warning line, then the beam fires
  for (const b of g.beams) {
    const firing = b.t >= b.warn;
    ctx.save();
    if (firing) {
      ctx.shadowColor = "#ff6fb5";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = "#ff8cc6";
      ctx.lineWidth = 8;
    } else {
      const pulse = 0.35 + 0.35 * Math.sin(t / 60);
      ctx.strokeStyle = `rgba(255,111,181,${pulse})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
    }
    ctx.beginPath();
    if (b.dir === "h") { ctx.moveTo(0, b.pos); ctx.lineTo(W, b.pos); }
    else { ctx.moveTo(b.pos, 0); ctx.lineTo(b.pos, H); }
    ctx.stroke();
    ctx.restore();
  }

  // Bolts (drawn along their direction of travel)
  ctx.save();
  ctx.shadowColor = "#ff4d6d";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "#ff6b81";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  for (const b of g.bolts) {
    const len = Math.hypot(b.vx, b.vy) || 1;
    ctx.beginPath();
    ctx.moveTo(b.x - (b.vx / len) * 18, b.y - (b.vy / len) * 18);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();

  // Pick-ups: cyan data capsules and green shield cells
  for (const k of g.pickups) {
    ctx.save();
    ctx.translate(k.x, k.y);
    const bob = 1 + 0.12 * Math.sin(t / 150 + k.x);
    ctx.scale(bob, bob);
    if (k.kind === "data") {
      ctx.shadowColor = "#3dd6f5";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#3dd6f5";
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-9, -9, 18, 18);
      ctx.rotate(-Math.PI / 4);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0b1026";
      ctx.font = "700 9px system-ui, sans-serif";
      ctx.fillText("i", -1.5, 3.5);
    } else {
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(-1.5, -6, 3, 12);
      ctx.fillRect(-6, -1.5, 12, 3);
    }
    ctx.restore();
  }

  // Ship (blinks while shields recharge)
  if (g.inv > 0 && Math.floor(t / 90) % 2 === 0) return;
  ctx.save();
  ctx.translate(g.x, g.y);
  if (g.flash > 0) {
    ctx.strokeStyle = `rgba(74,222,128,${g.flash * 2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
  }
  const flame = 10 + Math.sin(t / 40) * 4;
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.moveTo(-6, 14);
  ctx.lineTo(0, 14 + flame);
  ctx.lineTo(6, 14);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.quadraticCurveTo(11, -6, 9, 14);
  ctx.lineTo(-9, 14);
  ctx.quadraticCurveTo(-11, -6, 0, -20);
  ctx.fill();
  ctx.fillStyle = "#7b5cff";
  ctx.beginPath();
  ctx.moveTo(-9, 6); ctx.lineTo(-16, 16); ctx.lineTo(-8, 14); ctx.closePath();
  ctx.moveTo(9, 6); ctx.lineTo(16, 16); ctx.lineTo(8, 14); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3dd6f5";
  ctx.beginPath();
  ctx.arc(0, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
