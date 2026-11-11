// Canvas drawings shared by the games: real rockets, the Mars cruise spacecraft, space rocks,
// smoke and flames. Colors follow the real hardware (Delta II's teal first stage, Atlas V's
// orange-brown booster with white solid rocket boosters).

export type RocketKind = "delta" | "atlas";
export interface RocketState {
  boosters: boolean;
  fairing: boolean;
  firstStage: boolean;
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const mix = (a: string, b: string, t: number) => {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(t))).join(",")})`;
};

/** Sideways-lit cylinder fill (light from the left), so bodies look round. */
function tube(ctx: CanvasRenderingContext2D, x: number, w: number, base: string, dark: string) {
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, dark);
  g.addColorStop(0.28, base);
  g.addColorStop(0.45, base);
  g.addColorStop(1, dark);
  return g;
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string | CanvasGradient) {
  ctx.fillStyle = fill;
  ctx.fillRect(x - w / 2, y, w, h);
}

/** Ogive nose (fairing or booster cap), from base width w at y up by h. */
function nose(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string | CanvasGradient) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.bezierCurveTo(x - w / 2, y - h * 0.55, x - w * 0.18, y - h, x, y - h);
  ctx.bezierCurveTo(x + w * 0.18, y - h, x + w / 2, y - h * 0.55, x + w / 2, y);
  ctx.closePath();
  ctx.fill();
}

/** Engine flame: bright core, orange edge. In thin air the plume spreads and fades. */
export function flame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, len: number, t: number, vacuum = 0) {
  const flick = 1 + 0.08 * Math.sin(t / 23 + x) + 0.05 * Math.sin(t / 7 + x * 3);
  const L = len * flick * (1 + vacuum * 0.4);
  const spread = w * (1 + vacuum * 1.6);
  ctx.save();
  ctx.globalAlpha = 1 - vacuum * 0.45;
  const g = ctx.createLinearGradient(0, y, 0, y + L);
  g.addColorStop(0, "#fffaf0");
  g.addColorStop(0.18, "#ffe6a8");
  g.addColorStop(0.5, "#ffad5c");
  g.addColorStop(1, "rgba(255,120,40,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.quadraticCurveTo(x - spread * 0.75, y + L * 0.35, x, y + L);
  ctx.quadraticCurveTo(x + spread * 0.75, y + L * 0.35, x + w / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.ellipse(x, y + L * 0.12, w * 0.28, L * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * The Mars spacecraft as it flies to Mars: cruise stage (solar cells) on top of the aeroshell
 * (white backshell, brown heat shield). `s` is the scale; 1 is about 44 px wide.
 */
export function craft(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // heat shield (bottom)
  ctx.fillStyle = "#6b4a33";
  ctx.beginPath();
  ctx.ellipse(0, 12, 21, 5, 0, 0, Math.PI);
  ctx.fill();
  // backshell
  ctx.fillStyle = tube(ctx, 0, 40, "#eceae4", "#9c9a94");
  ctx.beginPath();
  ctx.moveTo(-21, 12);
  ctx.lineTo(-9, -6);
  ctx.lineTo(9, -6);
  ctx.lineTo(21, 12);
  ctx.closePath();
  ctx.fill();
  // cruise stage ring with solar cells
  ctx.fillStyle = "#3a3f47";
  ctx.fillRect(-23, -12, 46, 6);
  ctx.fillStyle = "#1b2a4a";
  ctx.fillRect(-22, -11, 44, 4);
  ctx.strokeStyle = "rgba(160,180,220,0.35)";
  ctx.lineWidth = 0.5;
  for (let i = -20; i <= 20; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, -11);
    ctx.lineTo(i, -7);
    ctx.stroke();
  }
  // antenna
  ctx.fillStyle = "#c9c6bf";
  ctx.fillRect(-1, -18, 2, 6);
  ctx.beginPath();
  ctx.ellipse(0, -18, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A launch vehicle standing on its nozzles at (x, y). Height is about 150 px. */
export function rocket(ctx: CanvasRenderingContext2D, kind: RocketKind, st: RocketState, x: number, y: number, t: number, firing: boolean, vacuum: number) {
  const atlas = kind === "atlas";
  const core = atlas ? 20 : 16;
  const firstLen = atlas ? 78 : 72;
  const coreColor = atlas ? "#c7773a" : "#3f8c86";
  const coreDark = atlas ? "#6e3d1b" : "#1d4a46";

  if (st.firstStage) {
    // engines + flames
    if (firing) {
      flame(ctx, x, y + 2, core * 0.7, atlas ? 70 : 60, t, vacuum);
      if (st.boosters) {
        for (const dx of atlas ? [-15, 15] : [-12, 12]) flame(ctx, x + dx, y + 2, 7, 52, t + dx * 40, vacuum);
      }
    }
    ctx.fillStyle = "#2b2b2e";
    ctx.fillRect(x - core * 0.35, y - 2, core * 0.7, 5);

    // boosters behind (darker) then the core
    if (st.boosters) {
      for (const dx of atlas ? [-9, 9] : [-8, 8]) {
        rect(ctx, x + dx, y - 50, 7, 50, tube(ctx, x + dx, 7, "#d9d9d6", "#8f8f8c"));
        nose(ctx, x + dx, y - 50, 7, 10, "#cfcfcc");
      }
    }
    rect(ctx, x, y - firstLen, core, firstLen, tube(ctx, x, core, coreColor, coreDark));
    // subtle panel lines on the core
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let i = 1; i < 4; i++) ctx.fillRect(x - core / 2, y - (firstLen * i) / 4, core, 1);
    if (st.boosters) {
      for (const dx of atlas ? [-15, 15] : [-12, 12]) {
        rect(ctx, x + dx, y - 52, 8, 52, tube(ctx, x + dx, 8, "#f4f4f1", "#a4a4a0"));
        nose(ctx, x + dx, y - 52, 8, 12, tube(ctx, x + dx, 8, "#f4f4f1", "#a4a4a0"));
        ctx.fillStyle = "#3a3a3c";
        ctx.fillRect(x + dx - 3, y, 6, 3);
      }
    }
    y -= firstLen;
    // interstage
    rect(ctx, x, y - 8, core, 8, "#26272b");
    y -= 8;
  } else if (firing) {
    // upper stage engine: faint, wide plume in the vacuum of space
    flame(ctx, x, y + 6, 8, 38, t, 1);
    ctx.fillStyle = "#4a4a4e";
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 2);
    ctx.lineTo(x - 6, y + 7);
    ctx.lineTo(x + 6, y + 7);
    ctx.lineTo(x + 3, y - 2);
    ctx.fill();
  }

  // upper stage
  const upW = atlas ? 16 : 14;
  const upLen = atlas ? 30 : 22;
  rect(ctx, x, y - upLen, upW, upLen, tube(ctx, x, upW, atlas ? "#e9e7e1" : "#f1f1ee", atlas ? "#9a978f" : "#a2a29e"));
  y -= upLen;

  if (st.fairing) {
    const fw = atlas ? 30 : 20;
    const cyl = atlas ? 30 : 22;
    if (atlas) {
      // the 5-meter fairing is wider than the rocket: a short boattail joins them
      ctx.fillStyle = tube(ctx, x, fw, "#f6f6f3", "#a9a9a5");
      ctx.beginPath();
      ctx.moveTo(x - upW / 2, y + 8);
      ctx.lineTo(x - fw / 2, y - 4);
      ctx.lineTo(x + fw / 2, y - 4);
      ctx.lineTo(x + upW / 2, y + 8);
      ctx.fill();
      y -= 4;
    }
    rect(ctx, x, y - cyl, fw, cyl, tube(ctx, x, fw, "#f6f6f3", "#a9a9a5"));
    nose(ctx, x, y - cyl, fw, atlas ? 30 : 24, tube(ctx, x, fw, "#f6f6f3", "#a9a9a5"));
  } else {
    craft(ctx, x, y - 14, atlas ? 0.6 : 0.5);
  }
}

/** Fairing half or spent booster tumbling away. */
export function debris(ctx: CanvasRenderingContext2D, kind: "booster" | "fairing" | "stage", x: number, y: number, rot: number, side: number, rocketKind: RocketKind, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  const white = tube(ctx, 0, 10, "#f2f2ef", "#9d9d99");
  if (kind === "booster") {
    rect(ctx, 0, -26, 8, 52, white);
    nose(ctx, 0, -26, 8, 11, white);
  } else if (kind === "fairing") {
    const w = rocketKind === "atlas" ? 15 : 10;
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(0, -26);
    ctx.quadraticCurveTo(side * w, -20, side * w, 0);
    ctx.lineTo(side * w, 26);
    ctx.closePath();
    ctx.fill();
  } else {
    const c = rocketKind === "atlas" ? "#c7773a" : "#3f8c86";
    const d = rocketKind === "atlas" ? "#6e3d1b" : "#1d4a46";
    rect(ctx, 0, -36, rocketKind === "atlas" ? 20 : 16, 72, tube(ctx, 0, 18, c, d));
    rect(ctx, 0, -44, rocketKind === "atlas" ? 20 : 16, 8, "#26272b");
  }
  ctx.restore();
}

/** Irregular space rock: a fixed outline (radius multipliers), lit from the upper left. */
export function spaceRock(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, shape: number[], tone: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const base = tone > 0.5 ? "#857a70" : "#6f665f";
  const g = ctx.createRadialGradient(-r * 0.45, -r * 0.45, r * 0.1, 0, 0, r * 1.15);
  g.addColorStop(0, tone > 0.5 ? "#b3a89c" : "#968b80");
  g.addColorStop(0.55, base);
  g.addColorStop(1, "#2e2925");
  ctx.fillStyle = g;
  ctx.beginPath();
  shape.forEach((m, i) => {
    const a = (i / shape.length) * Math.PI * 2;
    const px = Math.cos(a) * r * m;
    const py = Math.sin(a) * r * m;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();
  // a few craters
  ctx.fillStyle = "rgba(30,25,22,0.35)";
  for (let i = 0; i < 3; i++) {
    const a = shape[i] * 7 + i * 2.1;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, r * (0.12 + 0.06 * i), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const rockShape = () => Array.from({ length: 11 }, () => 0.72 + Math.random() * 0.32);

/** Soft cloud made of overlapping puffs. */
export function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, alpha: number, seed: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 7; i++) {
    const px = x + (((seed * (i + 3)) % 1) - 0.5) * w;
    const py = y + (((seed * (i + 7) * 1.7) % 1) - 0.5) * w * 0.18;
    const r = w * (0.12 + ((seed * (i + 1) * 2.3) % 1) * 0.12);
    const g = ctx.createRadialGradient(px, py - r * 0.3, r * 0.2, px, py, r);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.7, "rgba(236,240,246,0.75)");
    g.addColorStop(1, "rgba(236,240,246,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  return img;
}
