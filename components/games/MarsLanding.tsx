"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WinPanel } from "./GameShell";
import { addStars } from "@/lib/stars";

// Mars Landing: a rocket flies over Mars carrying a lander with a rover inside.
// 1. Release the lander at the right moment (it keeps the rocket's speed, so release early).
// 2. Steer with the side thrusters (limited fuel) and open the parachute in time.
// 3. Touch down slowly inside the landing zone, and the rover rolls out.

const W = 960;
const H = 540;
const WORLD = 2800;
const ZONE = { from: 1950, to: 2170 };
const G = 95; // gravity, px/s²
const SAFE_SPEED = 75; // max touchdown speed, px/s
const PX_PER_M = 2;

type Phase = "ready" | "flight" | "fall" | "landed" | "crashed" | "missed";

const ground = (x: number) => {
  if (x >= ZONE.from - 40 && x <= ZONE.to + 40) return 470;
  return 470 - 26 * Math.sin(x / 140) - 14 * Math.sin(x / 53 + 1.3) - (x < 400 ? (400 - x) * 0.08 : 0);
};

export default function MarsLanding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hud, setHud] = useState({ alt: 0, speed: 0, fuel: 100, chute: false, wind: 0 });
  const [result, setResult] = useState({ stars: 0, distance: 0, speed: 0 });

  const sim = useRef({
    rocket: { x: 80, y: 110, vx: 230 },
    lander: { x: 0, y: 0, vx: 0, vy: 0 },
    chute: false, chuteT: 0, fuel: 100, wind: 0,
    rover: 0, keys: new Set<string>(), pad: 0,
  });
  const phaseRef = useRef<Phase>("ready");
  phaseRef.current = phase;

  const reset = useCallback(() => {
    const s = sim.current;
    s.rocket = { x: 80, y: 110, vx: 230 };
    s.lander = { x: 0, y: 0, vx: 0, vy: 0 };
    s.chute = false;
    s.chuteT = 0;
    s.fuel = 100;
    s.wind = Math.round((Math.random() * 2 - 1) * 28);
    s.rover = 0;
    setHud({ alt: 0, speed: 0, fuel: 100, chute: false, wind: s.wind });
  }, []);

  const action = useCallback(() => {
    const s = sim.current;
    const p = phaseRef.current;
    if (p === "ready" || p === "crashed" || p === "missed" || p === "landed") {
      reset();
      setPhase("flight");
    } else if (p === "flight") {
      s.lander = { x: s.rocket.x, y: s.rocket.y + 26, vx: s.rocket.vx, vy: 0 };
      setPhase("fall");
    } else if (p === "fall" && !s.chute) {
      s.chute = true;
    }
  }, [reset]);

  useEffect(() => reset(), [reset]);

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
      const p = phaseRef.current;

      if (p === "flight" || p === "fall") {
        s.rocket.x += s.rocket.vx * dt;
        if (p === "flight" && s.rocket.x > WORLD + 120) setPhase("missed");
      }

      if (p === "fall") {
        const L = s.lander;
        let steer = s.pad;
        if (s.keys.has("arrowleft") || s.keys.has("a")) steer -= 1;
        if (s.keys.has("arrowright") || s.keys.has("d")) steer += 1;
        steer = Math.max(-1, Math.min(1, steer));
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

        const bottom = L.y + 16;
        if (bottom >= ground(L.x)) {
          L.y = ground(L.x) - 16;
          const speed = L.vy;
          const zoneMid = (ZONE.from + ZONE.to) / 2;
          const inZone = L.x >= ZONE.from && L.x <= ZONE.to;
          const distance = Math.round(Math.abs(L.x - zoneMid) / PX_PER_M);
          if (speed > SAFE_SPEED) {
            setResult({ stars: 0, distance, speed: Math.round(speed / PX_PER_M) });
            setPhase("crashed");
          } else if (!inZone) {
            setResult({ stars: 1, distance, speed: Math.round(speed / PX_PER_M) });
            addStars(1);
            setPhase("crashed"); // landed safely, but outside the zone
          } else {
            const stars = 5 + (distance <= 20 ? 3 : 0);
            setResult({ stars, distance, speed: Math.round(speed / PX_PER_M) });
            addStars(stars);
            setPhase("landed");
          }
          L.vx = 0;
          L.vy = 0;
        }
        uiTick += dt;
        if (uiTick > 0.08) {
          uiTick = 0;
          setHud({
            alt: Math.max(0, Math.round((ground(L.x) - (L.y + 16)) / PX_PER_M)),
            speed: Math.round(L.vy / PX_PER_M),
            fuel: Math.round(s.fuel),
            chute: s.chute,
            wind: s.wind,
          });
        }
      }

      if (p === "landed") s.rover = Math.min(110, s.rover + 22 * dt);

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

  const actionLabel =
    phase === "flight" ? "Release lander" : phase === "fall" ? (hud.chute ? "Parachute open" : "Open parachute") : phase === "ready" ? "Start mission" : "Try again";
  const tooFast = phase === "fall" && hud.speed > SAFE_SPEED / PX_PER_M;
  const safeLandingOutside = phase === "crashed" && result.stars === 1;

  return (
    <div className="arcade landing">
      <div className="arcade-hud">
        <span className="t-label">Altitude <b>{phase === "fall" ? `${hud.alt} m` : "—"}</b></span>
        <span className={`t-label${tooFast ? " c-danger" : ""}`}>Descent <b>{phase === "fall" ? `${hud.speed} m/s` : "—"}</b></span>
        <span className="t-label">
          Fuel <span className="fuel"><span style={{ width: `${hud.fuel}%` }} /></span>
        </span>
        <span className="t-label c-muted">Wind {hud.wind > 0 ? "→" : hud.wind < 0 ? "←" : "·"} {Math.abs(Math.round(hud.wind / PX_PER_M))} m/s</span>
      </div>

      <div className="arcade-stage">
        <canvas ref={canvasRef} className="arcade-canvas" style={{ aspectRatio: `${W} / ${H}` }} onPointerDown={action} aria-label="Mars Landing game area" />

        {(phase === "ready" || phase === "crashed" || phase === "missed") && (
          <div className="stage-overlay">
            {phase === "ready" && (
              <>
                <h2 className="t-title">Land on Mars</h2>
                <ol className="steps t-body-sm c-muted">
                  <li>The rocket flies over Mars. Press <kbd>Space</kbd> (or tap) to release the lander. It keeps moving forward, so release before the zone.</li>
                  <li>Steer with <kbd>←</kbd> <kbd>→</kbd> (uses fuel) and press <kbd>Space</kbd> again to open the parachute.</li>
                  <li>Touch down slower than {SAFE_SPEED / PX_PER_M} m/s inside the green landing zone.</li>
                </ol>
              </>
            )}
            {phase === "crashed" && !safeLandingOutside && (
              <>
                <h2 className="t-title">Too fast!</h2>
                <p className="t-body-sm c-muted">You hit the ground at {result.speed} m/s. Open the parachute earlier to slow down.</p>
              </>
            )}
            {safeLandingOutside && (
              <>
                <h2 className="t-title">Safe, but off target</h2>
                <p className="t-body-sm c-muted">You landed gently, {result.distance} m from the landing zone (+1 star). Release the lander a little earlier or later.</p>
              </>
            )}
            {phase === "missed" && (
              <>
                <h2 className="t-title">Missed the drop</h2>
                <p className="t-body-sm c-muted">The rocket flew past the landing zone. Release the lander before you reach it.</p>
              </>
            )}
            <button className="btn-purple t-label" onClick={action}>{phase === "ready" ? "Start mission" : "Try again"}</button>
          </div>
        )}
      </div>

      <div className="landing-controls">
        <button className="pad-btn" aria-label="Steer left" {...hold(-1)} disabled={phase !== "fall"}>◀</button>
        <button className="btn-purple t-label action-btn" onClick={action} disabled={phase === "fall" && hud.chute}>
          {actionLabel}
        </button>
        <button className="pad-btn" aria-label="Steer right" {...hold(1)} disabled={phase !== "fall"}>▶</button>
      </div>

      {phase === "landed" && (
        <WinPanel
          title="Touchdown in Ares Vallis!"
          stars={result.stars}
          sourceTitle="Mars Pathfinder"
          sourceUrl="https://science.nasa.gov/mission/mars-pathfinder/"
          onAgain={action}
          facts={[
            "Mars Pathfinder landed for real on July 4, 1997, in an ancient flood plain called Ares Vallis.",
            "Its lander was named the Carl Sagan Memorial Station.",
            "The Sojourner rover then drove off the lander and became the first rover to drive on another planet.",
          ]}
        >
          <p className="t-body-sm c-muted">
            Landed at {result.speed} m/s, {result.distance} m from the center of the zone.
            {result.distance <= 20 ? " Bullseye!" : ""}
          </p>
        </WinPanel>
      )}
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  s: { rocket: { x: number; y: number }; lander: { x: number; y: number; vx: number }; chute: boolean; chuteT: number; wind: number; rover: number },
  phase: Phase,
  t: number,
) {
  const focus = phase === "flight" || phase === "ready" || phase === "missed" ? s.rocket.x : s.lander.x;
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

  // Landing zone
  ctx.fillStyle = "rgba(74, 222, 128, 0.25)";
  ctx.fillRect(ZONE.from, ground(ZONE.from) - 4, ZONE.to - ZONE.from, 8);
  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(ZONE.from, ground(ZONE.from) - 130);
  ctx.lineTo(ZONE.from, ground(ZONE.from));
  ctx.moveTo(ZONE.to, ground(ZONE.to) - 130);
  ctx.lineTo(ZONE.to, ground(ZONE.to));
  ctx.stroke();
  ctx.setLineDash([]);
  const mid = (ZONE.from + ZONE.to) / 2;
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(mid - 1, ground(mid) - 46, 2, 46);
  ctx.beginPath();
  ctx.moveTo(mid + 1, ground(mid) - 46);
  ctx.lineTo(mid + 22, ground(mid) - 39);
  ctx.lineTo(mid + 1, ground(mid) - 32);
  ctx.fill();
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillText("ARES VALLIS · LANDING ZONE", ZONE.from + 8, ground(ZONE.from) - 140);

  // Rocket (flies left to right)
  if (phase !== "landed" || s.rocket.x < cam + W + 100) {
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
      // lander still attached underneath
      ctx.fillStyle = "#c9cfe6";
      ctx.beginPath(); ctx.moveTo(-10, 13); ctx.lineTo(10, 13); ctx.lineTo(0, 30); ctx.fill();
    }
    ctx.restore();
  }

  // Lander + parachute
  if (phase === "fall" || phase === "landed" || phase === "crashed") {
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
    const crashed = phase === "crashed" && L.vx === 0 && s.rover === 0;
    ctx.fillStyle = crashed ? "#6b6f84" : "#c9cfe6";
    ctx.beginPath();
    ctx.moveTo(L.x - 16, L.y + 16); ctx.lineTo(L.x + 16, L.y + 16); ctx.lineTo(L.x, L.y - 12); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3dd6f5";
    ctx.fillRect(L.x - 3, L.y + 2, 6, 4);

    // Rover rolls out after a good landing
    if (phase === "landed") {
      const rx = L.x + 18 + s.rover;
      const gy = ground(rx);
      ctx.fillStyle = "#e8ebf6";
      ctx.fillRect(rx - 10, gy - 14, 20, 7);
      ctx.fillStyle = "#3dd6f5";
      ctx.fillRect(rx - 12, gy - 18, 24, 3);
      ctx.fillStyle = "#151b3d";
      for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.arc(rx + dx, gy - 4, 3.5, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  ctx.restore();

  // Wind sock style indicator
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 12px system-ui, sans-serif";
  if (phase === "flight") ctx.fillText("Release before the zone: the lander keeps moving forward", 16, 28);
}
