"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WinPanel } from "./GameShell";
import { addStars } from "@/lib/stars";

// Laser Dodge: fly from Earth to Mars and dodge the lasers.
// Arrow keys / WASD move the ship. On touch screens, drag anywhere on the game or use the arrow pad.
// Two kinds of lasers: fast bolts falling from above, and beams that flash a warning line, then fire.

const W = 480;
const H = 640;
const TRIP_SECONDS = 60;
const SHIELDS = 3;

type Status = "ready" | "playing" | "paused" | "won" | "lost";

interface Bolt { x: number; y: number; vx: number; vy: number }
interface Beam { dir: "h" | "v"; pos: number; t: number; warn: number; fire: number }
interface Star { x: number; y: number; s: number; v: number }

export default function LaserDodge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [shields, setShields] = useState(SHIELDS);
  const [progress, setProgress] = useState(0);
  const [earned, setEarned] = useState(0);

  const game = useRef({
    x: W / 2, y: H - 110, inv: 0, hits: 0, progress: 0, spawn: 0,
    bolts: [] as Bolt[], beams: [] as Beam[], stars: [] as Star[],
    keys: new Set<string>(), target: null as { x: number; y: number } | null, pad: { x: 0, y: 0 },
  });
  const statusRef = useRef<Status>("ready");
  statusRef.current = status;

  const reset = useCallback(() => {
    const g = game.current;
    Object.assign(g, { x: W / 2, y: H - 110, inv: 0, hits: 0, progress: 0, spawn: 1, bolts: [], beams: [], target: null });
    g.stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.6 + 0.4, v: Math.random() * 60 + 30 }));
    setShields(SHIELDS);
    setProgress(0);
  }, []);

  useEffect(() => reset(), [reset]);

  const begin = () => {
    reset();
    setStatus("playing");
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
  }, []);

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

        // Journey
        g.progress = Math.min(1, g.progress + dt / TRIP_SECONDS);
        g.inv = Math.max(0, g.inv - dt);

        // Spawn lasers, faster as Mars gets closer
        g.spawn -= dt;
        if (g.spawn <= 0) {
          const p = g.progress;
          g.spawn = 1.1 - 0.65 * p + Math.random() * 0.25;
          if (Math.random() < 0.62 - 0.12 * p) {
            const n = p > 0.6 ? 2 : 1;
            for (let i = 0; i < n; i++)
              g.bolts.push({ x: 20 + Math.random() * (W - 40), y: -20, vx: (Math.random() - 0.5) * 80, vy: 240 + p * 230 + Math.random() * 60 });
          } else {
            const dir = Math.random() < 0.6 ? "h" : "v";
            g.beams.push({ dir, pos: dir === "h" ? 80 + Math.random() * (H - 140) : 30 + Math.random() * (W - 60), t: 0, warn: 1.0 - 0.3 * p, fire: 0.35 });
          }
        }

        for (const b of g.bolts) { b.x += b.vx * dt; b.y += b.vy * dt; }
        g.bolts = g.bolts.filter((b) => b.y < H + 30);
        for (const b of g.beams) b.t += dt;
        g.beams = g.beams.filter((b) => b.t < b.warn + b.fire);

        // Collisions
        if (g.inv <= 0) {
          const r = 12;
          const hitBolt = g.bolts.some((b) => {
            // distance from ship to the bolt's short line segment
            const x1 = b.x, y1 = b.y - 18, x2 = b.x, y2 = b.y;
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

        if (g.progress >= 1) {
          const stars = 5 + (g.hits === 0 ? 3 : 0);
          addStars(stars);
          setEarned(stars);
          setStatus("won");
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

      draw(ctx, g, t);
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
          aria-label="Laser Dodge game area"
        />

        {status !== "playing" && status !== "won" && (
          <div className="stage-overlay">
            {status === "ready" && (
              <>
                <h2 className="t-title">Fly to Mars</h2>
                <p className="t-body-sm c-muted">Dodge the laser bolts and the beams. Beams flash a warning line before they fire. You have 3 shields.</p>
                <p className="t-caption c-muted">Arrow keys or WASD to move · Drag on touch screens · P to pause</p>
                <button className="btn-purple t-label" onClick={begin}>Launch</button>
              </>
            )}
            {status === "paused" && (
              <>
                <h2 className="t-title">Paused</h2>
                <button className="btn-purple t-label" onClick={() => setStatus("playing")}>Resume</button>
              </>
            )}
            {status === "lost" && (
              <>
                <h2 className="t-title">Shields down</h2>
                <p className="t-body-sm c-muted">You made it {Math.round(progress * 100)}% of the way to Mars. Watch for the warning lines!</p>
                <button className="btn-purple t-label" onClick={begin}>Try again</button>
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
          title="You made it to Mars!"
          stars={earned}
          sourceTitle="Mars Pathfinder"
          sourceUrl="https://science.nasa.gov/mission/mars-pathfinder/"
          onAgain={begin}
          facts={[
            "Mars Pathfinder launched on Dec. 4, 1996, and landed on Mars on July 4, 1997.",
            "Mars is on average 228 million km from the Sun. Sunlight takes about 13 minutes to get there.",
            "Mars is about half the size of Earth.",
          ]}
        >
          <p className="t-body-sm c-muted">
            {earned === 8 ? "Perfect flight: no hits!" : "You reached Mars with shields to spare."}
          </p>
        </WinPanel>
      )}
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, g: {
  x: number; y: number; inv: number; progress: number; bolts: Bolt[]; beams: Beam[]; stars: Star[];
}, t: number) {
  // Space
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1a1245");
  sky.addColorStop(1, "#0b1026");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  for (const s of g.stars) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + s.s / 3})`;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }

  // Earth falls behind, Mars grows ahead
  const p = g.progress;
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

  // Bolts
  ctx.save();
  ctx.shadowColor = "#ff4d6d";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "#ff6b81";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  for (const b of g.bolts) {
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - 18);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();

  // Ship (blinks while shields recharge)
  if (g.inv > 0 && Math.floor(t / 90) % 2 === 0) return;
  ctx.save();
  ctx.translate(g.x, g.y);
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
