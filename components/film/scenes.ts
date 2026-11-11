// Animated scenes for the story film. Each scene is drawn every frame on a 1600×900 stage
// (scaled to cover the screen) from `t`, the seconds since the scene started, so every
// scene plays like a short looping video clip.

import type { Scene } from "@/lib/film/types";
import { cloud, craft, mix, rocket } from "@/components/games/art";
import { airbags, backshell, boulder, capsule, chuteAbove, hash, petals, rover } from "@/components/games/marsArt";

export const VW = 1600;
export const VH = 900;

export type Images = Record<string, HTMLImageElement | undefined>;
type C = CanvasRenderingContext2D;

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
const ready = (img?: HTMLImageElement) => !!img && img.complete && img.naturalWidth > 0;

/** Draw something scaled by k around (x, y). */
function at(ctx: C, x: number, y: number, k: number, draw: () => void) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.translate(-x, -y);
  draw();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------------------------

function space(ctx: C, t: number, drift = 6, tint = "#080d22") {
  const g = ctx.createRadialGradient(VW * 0.2, -100, 50, VW * 0.4, VH * 0.4, VW);
  g.addColorStop(0, "#1a1748");
  g.addColorStop(0.5, tint);
  g.addColorStop(1, "#03050f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VW, VH);
  stars(ctx, t, drift, 1);
}

function stars(ctx: C, t: number, drift: number, alpha: number) {
  for (let i = 0; i < 260; i++) {
    const depth = 0.3 + hash(i * 3.1) * 0.7;
    const x = (hash(i) * VW - t * drift * depth + VW * 10) % VW;
    const y = hash(i + 0.5) * VH;
    const tw = 0.55 + 0.45 * Math.sin(t * (0.6 + hash(i * 7) * 2) + i);
    ctx.globalAlpha = alpha * (0.25 + 0.75 * depth) * tw;
    ctx.fillStyle = hash(i * 9) > 0.92 ? "#bfd4ff" : hash(i * 11) > 0.95 ? "#ffe2b8" : "#ffffff";
    const s = depth > 0.85 ? 2.4 : 1.4;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}

/** A real photo of a planet (round, with a sunlit side). */
function planet(ctx: C, img: HTMLImageElement | undefined, x: number, y: number, r: number, fallback: [string, string], atmo: string, rot = 0) {
  const glow = ctx.createRadialGradient(x, y, r * 0.95, x, y, r * 1.12);
  glow.addColorStop(0, atmo);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.12, 0, Math.PI * 2);
  ctx.fill();
  if (ready(img)) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(img!, -r, -r, r * 2, r * 2);
    ctx.restore();
  } else {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, fallback[0]);
    g.addColorStop(1, fallback[1]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const sh = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  sh.addColorStop(0.4, "rgba(0,0,0,0)");
  sh.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Martian day sky, layered hills and ground. `cam` scrolls the hills sideways. */
function marsLand(ctx: C, cam: number, horizon = 600, night = 0) {
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, mix("a07658", "070a18", night));
  sky.addColorStop(0.7, mix("cfa680", "141a33", night));
  sky.addColorStop(1, mix("e3c4a0", "2a2a40", night));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, horizon + 2);
  const hills: [number, number, number, string, number][] = [
    [0.04, horizon - 70, 55, "b38a6b", 420],
    [0.1, horizon - 30, 40, "9f6d4f", 260],
    [0.22, horizon + 10, 24, "8c5a3c", 140],
  ];
  for (const [p, base, amp, col, sc] of hills) {
    ctx.fillStyle = mix(col, "101320", night * 0.85);
    ctx.beginPath();
    ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 16) {
      const wx = x + cam * p;
      ctx.lineTo(x, base - amp * (Math.sin(wx / sc) * 0.55 + Math.sin(wx / (sc * 0.37) + 1.7) * 0.25 + Math.abs(Math.sin(wx / (sc * 2.3))) * 0.6));
    }
    ctx.lineTo(VW, VH);
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, horizon, 0, VH);
  g.addColorStop(0, mix("9a5d3b", "1a1622", night * 0.85));
  g.addColorStop(1, mix("5e331f", "0c0b12", night * 0.85));
  ctx.fillStyle = g;
  ctx.fillRect(0, horizon + 20, VW, VH - horizon);
  // pebbles
  for (let i = 0; i < 160; i++) {
    const depth = hash(i * 1.7);
    const y = horizon + 30 + depth * (VH - horizon - 30);
    const x = ((hash(i * 2.9) * VW * 3 - cam * (0.3 + depth)) % (VW * 1.2) + VW * 1.2) % (VW * 1.2) - VW * 0.1;
    const r = 1.5 + depth * 6 * hash(i * 5.3);
    ctx.fillStyle = mix(hash(i) > 0.5 ? "6b3b25" : "c58f69", "15131c", night * 0.85);
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.4, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Soft glowing radio pulse moving from a to b (0..1 = progress). */
function pulse(ctx: C, ax: number, ay: number, bx: number, by: number, p: number, color: string, arc = 120) {
  const mx = (ax + bx) / 2;
  const my = Math.min(ay, by) - arc;
  const pt = (k: number) => ({
    x: (1 - k) * (1 - k) * ax + 2 * (1 - k) * k * mx + k * k * bx,
    y: (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * my + k * k * by,
  });
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.setLineDash([3, 12]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(mx, my, bx, by);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 6; i++) {
    const k = p - i * 0.02;
    if (k < 0 || k > 1) continue;
    const q = pt(k);
    ctx.globalAlpha = 1 - i / 6;
    const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 16 - i * 2);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.3, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(q.x, q.y, 16 - i * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function label(ctx: C, text: string, x: number, y: number, align: CanvasTextAlign = "center", size = 22, color = "rgba(238,241,255,0.85)") {
  ctx.font = `600 ${size}px "IBM Plex Sans", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.textAlign = "start";
}

function vignette(ctx: C, strength = 0.55) {
  const g = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VW, VH);
}

function dust(ctx: C, t: number, n = 70, color = "230,190,150") {
  for (let i = 0; i < n; i++) {
    const x = ((hash(i) * VW + t * (20 + hash(i * 3) * 60)) % (VW + 40)) - 20;
    const y = hash(i * 7) * VH + Math.sin(t * 0.7 + i) * 12;
    ctx.fillStyle = `rgba(${color},${0.08 + hash(i * 5) * 0.25})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + hash(i * 9) * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Cover-fit an image with a camera that eases from `from` to `to` ([zoom, focusX, focusY]). */
function kenBurns(ctx: C, img: HTMLImageElement, t: number, dur: number, from: [number, number, number], to: [number, number, number]) {
  const k = ease(t / dur);
  const z = from[0] + (to[0] - from[0]) * k;
  const fx = from[1] + (to[1] - from[1]) * k;
  const fy = from[2] + (to[2] - from[2]) * k;
  const base = Math.max(VW / img.naturalWidth, VH / img.naturalHeight) * z;
  const w = img.naturalWidth * base;
  const h = img.naturalHeight * base;
  const x = clamp(VW / 2 - fx * w, VW - w, 0);
  const y = clamp(VH / 2 - fy * h, VH - h, 0);
  ctx.drawImage(img, x, y, w, h);
}

// ---------------------------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------------------------

export function drawScene(ctx: C, sc: Scene, t: number, img: Images) {
  ctx.save();
  switch (sc.kind) {
    case "title":
    case "chapter": {
      space(ctx, t, 4);
      const r = sc.kind === "title" ? 560 : 420;
      const rise = sc.kind === "title" ? 1 - ease(t / 6) : 0;
      planet(ctx, img["/games/mars.webp"], VW * 0.5, VH + r * 0.55 + rise * 220, r, ["#d9895a", "#7a2e17"], "rgba(255,150,100,0.35)", Math.PI + t * 0.01);
      vignette(ctx, 0.5);
      break;
    }
    case "pad":
      drawPad(ctx, t);
      break;
    case "inside": {
      space(ctx, t, 3);
      const k = 5.2 + 0.2 * Math.sin(t * 0.4);
      at(ctx, VW * 0.5, VH * 0.4, k, () => craft(ctx, VW * 0.5, VH * 0.4, 1));
      // callout to the folded rover inside the aeroshell
      const a = ease((t - 1) / 1);
      ctx.globalAlpha = a;
      ctx.strokeStyle = "rgba(91,212,245,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(VW * 0.5 + 20, VH * 0.4 + 20);
      ctx.lineTo(VW * 0.66, VH * 0.56);
      ctx.lineTo(VW * 0.74, VH * 0.56);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(VW * 0.5 + 20, VH * 0.4 + 20, 10, 0, Math.PI * 2);
      ctx.stroke();
      label(ctx, "Sojourner, folded inside", VW * 0.75, VH * 0.56 + 9, "left", 30, "#9ee6fa");
      ctx.globalAlpha = 1;
      break;
    }
    case "ascent":
      drawAscent(ctx, t);
      break;
    case "cruise": {
      space(ctx, t, 10);
      const sun = ctx.createRadialGradient(VW * 0.08, VH * 0.1, 0, VW * 0.08, VH * 0.1, 420);
      sun.addColorStop(0, "rgba(255,240,210,0.55)");
      sun.addColorStop(1, "rgba(255,240,210,0)");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, VW, VH);
      const er = 230 - ease(t / 10) * 140;
      planet(ctx, img["/games/earth.webp"], VW * 0.16 - t * 4, VH * 0.62 + t * 6, er, ["#6fa5d8", "#1f4f8f"], "rgba(120,180,255,0.35)");
      const bob = Math.sin(t * 0.8) * 8;
      at(ctx, VW * 0.6 + t * 6, VH * 0.36 + bob, 3.6, () => craft(ctx, VW * 0.6 + t * 6, VH * 0.36 + bob, 1));
      if (Math.sin(t * 1.3) > 0.92) {
        ctx.fillStyle = "rgba(230,235,245,0.6)";
        ctx.beginPath();
        ctx.arc(VW * 0.6 + t * 6 - 96, VH * 0.36 + bob - 12, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      vignette(ctx, 0.4);
      break;
    }
    case "approach": {
      space(ctx, t, 6);
      const k = ease(t / 9);
      const r = 120 + k * 420;
      planet(ctx, img["/games/mars.webp"], VW * 0.62, VH * 0.42, r, ["#d9895a", "#7a2e17"], "rgba(255,150,100,0.3)", 0.4);
      const s = 2.4 - k * 1.2;
      at(ctx, VW * 0.22 + k * 140, VH * 0.56 - k * 70, s, () => craft(ctx, VW * 0.22 + k * 140, VH * 0.56 - k * 70, 1));
      vignette(ctx, 0.45);
      break;
    }
    case "entry":
      drawEntry(ctx, t, img["/games/mars.webp"]);
      break;
    case "parachute":
      drawParachute(ctx, t);
      break;
    case "airbags":
      drawAirbags(ctx, t);
      break;
    case "bounce":
      drawBounce(ctx, t);
      break;
    case "crawl":
      drawCrawl(ctx, t);
      break;
    case "signal":
      drawSignal(ctx, sc, t, img);
      break;
    case "days":
      drawDays(ctx, t);
      break;
    case "silence":
      drawSilence(ctx, t);
      break;
    case "end":
      drawEnd(ctx, t);
      break;
    case "kenburns": {
      const im = img[sc.image!];
      ctx.fillStyle = "#05070f";
      ctx.fillRect(0, 0, VW, VH);
      if (ready(im)) {
        if (sc.wide) {
          // ultra-wide panorama: fill the height and pan across
          const h = VH * 0.62;
          const w = im!.naturalWidth * (h / im!.naturalHeight);
          const x = -(w - VW) * ease(t / 12);
          ctx.drawImage(im!, x, (VH - h) / 2, w, h);
          const fade = ctx.createLinearGradient(0, (VH - h) / 2, 0, (VH + h) / 2);
          fade.addColorStop(0, "#05070f");
          fade.addColorStop(0.08, "rgba(5,7,15,0)");
          fade.addColorStop(0.92, "rgba(5,7,15,0)");
          fade.addColorStop(1, "#05070f");
          ctx.fillStyle = fade;
          ctx.fillRect(0, (VH - h) / 2, VW, h);
        } else {
          if (sc.gray) ctx.filter = "grayscale(1) contrast(1.1)";
          kenBurns(ctx, im!, t, 11, sc.from ?? [1, 0.5, 0.5], sc.to ?? [1.15, 0.5, 0.5]);
          ctx.filter = "none";
        }
      }
      if (sc.glow) {
        // engine light flickering on the smoke
        const f = 0.25 + 0.12 * Math.sin(t * 23) + 0.08 * Math.sin(t * 7);
        const g = ctx.createRadialGradient(VW * 0.5, VH * 0.95, 0, VW * 0.5, VH * 0.95, 700);
        g.addColorStop(0, `rgba(255,190,110,${f})`);
        g.addColorStop(1, "rgba(255,190,110,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, VW, VH);
      }
      if (sc.dust) dust(ctx, t);
      if (sc.water) drawWater(ctx, t);
      if (sc.measure) drawMeasure(ctx, t);
      if (sc.listen) drawListen(ctx, t);
      vignette(ctx, 0.5);
      break;
    }
    case "transmission":
      drawTransmission(ctx, sc, t, img[sc.image!]);
      break;
  }
  ctx.restore();
}

function drawPad(ctx: C, t: number) {
  // night launch at Cape Canaveral: floodlit rocket and tower, venting vapor
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, "#04071a");
  sky.addColorStop(0.75, "#13204a");
  sky.addColorStop(1, "#24305a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, VH);
  stars(ctx, t, 0, 0.8);
  const gy = 650;
  ctx.fillStyle = "#0d1430";
  ctx.fillRect(0, gy - 30, VW, 30);
  ctx.fillStyle = "#070a18";
  ctx.fillRect(0, gy, VW, VH - gy);
  // floodlight beams
  for (const bx of [VW * 0.28, VW * 0.72]) {
    const g = ctx.createLinearGradient(bx, gy, VW * 0.5, 260);
    g.addColorStop(0, "rgba(255,240,200,0.18)");
    g.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(bx - 8, gy);
    ctx.lineTo(VW * 0.5 - 90, 140);
    ctx.lineTo(VW * 0.5 + 90, 140);
    ctx.lineTo(bx + 8, gy);
    ctx.fill();
    ctx.fillStyle = "#fff5d8";
    ctx.beginPath();
    ctx.arc(bx, gy - 4, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // tower with red lights
  const tx = VW * 0.5 + 70;
  ctx.fillStyle = "#2a3150";
  ctx.fillRect(tx, gy - 520, 34, 520);
  ctx.strokeStyle = "#3b4466";
  ctx.lineWidth = 2;
  for (let y = gy - 520; y < gy; y += 26) {
    ctx.beginPath();
    ctx.moveTo(tx, y);
    ctx.lineTo(tx + 34, y + 26);
    ctx.moveTo(tx + 34, y);
    ctx.lineTo(tx, y + 26);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = Math.sin(t * 3 + i) > 0 ? "#ff4b3e" : "#5a1b18";
    ctx.beginPath();
    ctx.arc(tx + 17, gy - 520 + i * 130, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  at(ctx, VW * 0.5, gy - 6, 3.4, () =>
    rocket(ctx, "delta", { boosters: true, fairing: true, firstStage: true }, VW * 0.5, gy - 6, t * 1000, false, 0),
  );
  // venting vapor
  for (let i = 0; i < 18; i++) {
    const life = (t * 0.5 + hash(i)) % 1;
    const x = VW * 0.5 + (hash(i * 3) - 0.5) * 60 + life * (hash(i * 7) - 0.5) * 160;
    const y = gy - 280 - hash(i * 5) * 200 + life * 40;
    ctx.fillStyle = `rgba(230,236,250,${0.22 * (1 - life)})`;
    ctx.beginPath();
    ctx.arc(x, y, 14 + life * 50, 0, Math.PI * 2);
    ctx.fill();
  }
  vignette(ctx, 0.5);
}

function drawAscent(ctx: C, t: number) {
  // the sky darkens to space as the rocket climbs; Earth's curve appears below
  const a = ease(t / 8);
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, mix("2c5f9e", "000000", a * 1.1));
  sky.addColorStop(1, mix("8fbbe2", "0a1630", a));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, VH);
  stars(ctx, t, 0, clamp((a - 0.4) / 0.4));
  // clouds falling away below
  for (let i = 0; i < 6; i++) {
    const y = 300 + i * 160 + t * 260;
    if (y < VH + 200) cloud(ctx, hash(i) * VW, y, 380 + hash(i * 3) * 260, 0.85 * (1 - a), hash(i * 5));
  }
  if (a > 0.45) {
    const k = clamp((a - 0.45) / 0.5);
    const R = 2600;
    const cy = VH + R - 60 - k * 140;
    ctx.globalAlpha = k;
    const eg = ctx.createRadialGradient(VW / 2, cy, R - 260, VW / 2, cy, R);
    eg.addColorStop(0, "#163a70");
    eg.addColorStop(0.92, "#3f7cc0");
    eg.addColorStop(1, "#bfe4ff");
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(VW / 2, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // smoke trail, then the rocket
  const rx = VW * 0.5 + Math.sin(t * 0.6) * 10;
  const ry = VH * 0.58;
  for (let i = 0; i < 40; i++) {
    const y = ry + 170 + i * 26;
    ctx.fillStyle = `rgba(235,235,232,${0.32 * (1 - i / 40) * (1 - a)})`;
    ctx.beginPath();
    ctx.arc(rx + Math.sin(i * 1.3 + t) * (6 + i), y, 20 + i * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  at(ctx, rx, ry, 2.6, () =>
    rocket(ctx, "delta", { boosters: t < 3.5, fairing: t < 6.5, firstStage: true }, rx, ry, t * 1000, true, a),
  );
}

function drawEntry(ctx: C, t: number, mars?: HTMLImageElement) {
  const k = ease(t / 9);
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, mix("05060f", "6b4a3a", k * 0.6));
  sky.addColorStop(1, mix("231816", "c99a76", k * 0.7));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, VH);
  stars(ctx, t, 0, 1 - k * 1.3);
  const R = 2400 + k * 1600;
  const cy = VH + R - 210 + k * 40;
  ctx.save();
  ctx.beginPath();
  ctx.arc(VW / 2, cy, R, 0, Math.PI * 2);
  ctx.clip();
  if (ready(mars)) ctx.drawImage(mars!, VW / 2 - R, cy - R * 2 + 420, R * 2, R * 2);
  ctx.fillStyle = `rgba(214,170,130,${0.12 + 0.3 * k})`;
  ctx.fillRect(0, 0, VW, VH);
  ctx.restore();
  // fiery trail behind the capsule
  const cx = VW * 0.46 + t * 8;
  const cyy = VH * 0.36 + t * 6;
  for (let i = 0; i < 26; i++) {
    const g = ctx.createRadialGradient(cx - i * 16, cyy - i * 22, 0, cx - i * 16, cyy - i * 22, 40 + i * 3);
    g.addColorStop(0, `rgba(255,200,140,${0.22 * (1 - i / 26)})`);
    g.addColorStop(1, "rgba(255,120,60,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx - i * 16, cyy - i * 22, 40 + i * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  at(ctx, cx, cyy, 2.2, () => capsule(ctx, cx, cyy, t * 1000, 0, true, 1, -0.5));
  vignette(ctx, 0.5);
}

function drawParachute(ctx: C, t: number) {
  marsLand(ctx, t * 4, 780);
  const sway = Math.sin(t * 0.9) * 0.05;
  const x = VW * 0.5;
  const y = 300 + t * 8;
  ctx.save();
  ctx.translate(x, y - 160);
  ctx.rotate(sway);
  ctx.translate(-x, -(y - 160));
  at(ctx, x, y, 2.4, () => capsule(ctx, x, y, t * 1000, 1, t < 1.8, 0, 0));
  ctx.restore();
  // heat shield falling away
  if (t > 1.8) {
    const k = t - 1.8;
    ctx.save();
    ctx.translate(x + k * 30, y + 60 + k * k * 120);
    ctx.rotate(k * 1.8);
    ctx.fillStyle = "#4a3424";
    ctx.beginPath();
    ctx.ellipse(0, 0, 80, 22, 0, 0, Math.PI);
    ctx.fill();
    ctx.restore();
  }
  dust(ctx, t, 40);
}

function drawAirbags(ctx: C, t: number) {
  const k = ease(t / 8);
  marsLand(ctx, t * 6, 520 + k * 90);
  const x = VW * 0.5;
  const y = 360 + k * 70;
  const fire = t > 2.2;
  if (t < 2.2) chuteAbove(ctx, x, y - 330, t * 1000, 1);
  at(ctx, x, y - 230, 2.3, () => backshell(ctx, x, y - 230, fire, t * 1000));
  ctx.strokeStyle = "rgba(60,50,40,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 200);
  ctx.lineTo(x, y - 60);
  ctx.stroke();
  at(ctx, x, y, 2.2, () => airbags(ctx, x, y, 0.4 + 0.6 * ease((t - 0.6) / 1.4), 0));
  vignette(ctx, 0.35);
}

function drawBounce(ctx: C, t: number) {
  const cam = t * 220;
  marsLand(ctx, cam, 470);
  const ground = 590;
  // bounces get lower each time (about 15 bounces over the scene)
  const period = 0.75;
  const n = Math.floor(t / period);
  const ph = (t % period) / period;
  const h = 300 * Math.pow(0.8, n);
  const y = ground - 4 * h * ph * (1 - ph);
  const x = VW * 0.45;
  for (let i = 0; i < 30; i++) {
    const age = ph * period + (i / 30) * 0.4;
    const r = 10 + age * 120;
    ctx.fillStyle = `rgba(205,160,120,${0.35 * (1 - age / 0.6) * (n < 15 ? 1 : 0)})`;
    ctx.beginPath();
    ctx.arc(x - 60 + (hash(i + n) - 0.5) * 200, ground + 10 - hash(i * 3) * 30, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  at(ctx, x, y, 2.8, () => airbags(ctx, x, y, 1, t * 2.4));
  label(ctx, `Bounce ${Math.min(15, n + 1)}`, VW - 70, 150, "right", 34, "rgba(255,255,255,0.85)");
}

function drawCrawl(ctx: C, t: number) {
  marsLand(ctx, 0, 400);
  const gy = 590;
  const x = 360 + t * 36;
  // tracks behind the wheels
  ctx.fillStyle = "rgba(60,30,18,0.35)";
  for (let tx = 300; tx < x - 40; tx += 14) ctx.fillRect(tx, gy + 2, 8, 6);
  for (const [bx, br, s] of [[1080, 70, 3], [1380, 46, 9], [200, 40, 5]] as const) boulder(ctx, bx, gy, br, s);
  at(ctx, x, gy, 6.5, () => rover(ctx, x, gy, "Sojourner", t * 0.6));
  // ruler: about one centimetre per second
  ctx.strokeStyle = "rgba(91,212,245,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 60, gy - 250);
  ctx.lineTo(x + 60, gy - 250);
  ctx.stroke();
  label(ctx, "about 1 cm per second", x, gy - 270, "center", 30, "#9ee6fa");
  vignette(ctx, 0.35);
}

function drawSignal(ctx: C, sc: Scene, t: number, img: Images) {
  space(ctx, t, 2);
  const earth = { x: 250, y: 260 };
  const mars = { x: VW - 330, y: VH - 300 };
  planet(ctx, img["/games/earth.webp"], earth.x, earth.y, 120, ["#6fa5d8", "#1f4f8f"], "rgba(120,180,255,0.35)");
  planet(ctx, img["/games/mars.webp"], mars.x, mars.y, 190, ["#d9895a", "#7a2e17"], "rgba(255,150,100,0.3)");
  label(ctx, "Earth", earth.x, earth.y + 170, "center", 24);
  label(ctx, "Mars", mars.x, mars.y + 240, "center", 24);
  const p = (t % 4.5) / 4.5;
  if (sc.dir === "toMars") pulse(ctx, earth.x + 110, earth.y + 40, mars.x - 150, mars.y - 90, p, "#5bd4f5", 60);
  else if (sc.dir === "both") {
    pulse(ctx, earth.x + 110, earth.y + 40, mars.x - 150, mars.y - 90, (t % 6) / 6, "#5bd4f5", 60);
    pulse(ctx, mars.x - 150, mars.y - 110, earth.x + 120, earth.y + 70, ((t + 3) % 6) / 6, "#ffcf5c", -30);
  } else {
    // rover → lander (short hop) → Earth
    const lx = mars.x - 40, ly = mars.y - 196;
    const rx = mars.x + 70, ry = mars.y - 186;
    at(ctx, lx, ly, 1.1, () => petals(ctx, lx, ly, 1));
    at(ctx, rx, ry, 1.1, () => rover(ctx, rx, ry, "Sojourner", 0));
    const q = (t % 5) / 5;
    if (q < 0.25) pulse(ctx, rx, ry - 30, lx + 10, ly - 50, q / 0.25, "#ffcf5c", 40);
    else pulse(ctx, lx, ly - 60, earth.x + 110, earth.y + 50, (q - 0.25) / 0.75, "#ffcf5c", 80);
    label(ctx, "Sojourner", rx + 60, ry - 70, "center", 20);
    label(ctx, "Pathfinder lander", lx - 90, ly - 90, "center", 20);
  }
  if (sc.label) label(ctx, sc.label, VW / 2, 120, "center", 28, "#9ee6fa");
}

function drawDays(ctx: C, t: number) {
  // the Sun crosses the Martian sky again and again: day 1 … day 83
  const dur = 9;
  const k = clamp(t / dur);
  const day = Math.max(1, Math.min(83, Math.floor(1 + 82 * Math.pow(k, 1.6))));
  const phase = (Math.pow(k, 1.6) * 82) % 1;
  const night = clamp(Math.abs(phase - 0.5) * 2 - 0.55) * 1.6;
  marsLand(ctx, 0, 520, night);
  stars(ctx, t, 0, night);
  const sx = 200 + phase * (VW - 400);
  const sy = 500 - Math.sin(phase * Math.PI) * 330;
  if (night < 0.9) {
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 90);
    g.addColorStop(0, "rgba(255,255,245,0.95)");
    g.addColorStop(0.15, "rgba(220,235,255,0.6)");
    g.addColorStop(1, "rgba(220,235,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, 90, 0, Math.PI * 2);
    ctx.fill();
  }
  at(ctx, 640, 620, 3, () => petals(ctx, 640, 620, 1));
  at(ctx, 960, 630, 3.4, () => rover(ctx, 960, 630, "Sojourner", 0));
  ctx.font = '700 120px "IBM Plex Sans", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillStyle = day > 7 ? "#5bd4f5" : "#ffffff";
  ctx.fillText(`Day ${day}`, VW / 2, 200);
  ctx.textAlign = "start";
  label(ctx, day <= 7 ? "Planned mission: 7 days" : day < 83 ? "Still exploring!" : "83 days", VW / 2, 260, "center", 30, day > 7 ? "#9ee6fa" : "rgba(255,255,255,0.8)");
}

function drawSilence(ctx: C, t: number) {
  space(ctx, t, 1, "#05081a");
  const k = clamp(t / 5);
  const amp = 90 * (1 - ease(k));
  ctx.strokeStyle = "rgba(91,212,245,0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= VW; x += 6) {
    const local = amp * Math.exp(-Math.pow((x - VW * 0.35) / 420, 2));
    const y = VH / 2 + Math.sin(x / 18 - t * 8) * local * (0.6 + 0.4 * Math.sin(x / 70));
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  label(ctx, "Signal from Mars Pathfinder", 60, VH / 2 - 140, "left", 24, "rgba(238,241,255,0.7)");
  if (k >= 1 && Math.floor(t * 1.2) % 2 === 0) label(ctx, "NO SIGNAL", VW / 2, VH / 2 + 120, "center", 34, "#ffcf5c");
  vignette(ctx, 0.6);
}

function drawEnd(ctx: C, t: number) {
  // night at Ares Vallis: the lander and Sojourner, with Earth shining as a bright dot in the sky
  marsLand(ctx, 0, 520, 1);
  stars(ctx, t, 0, 1);
  const ex = VW * 0.8, ey = 170;
  const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 40);
  g.addColorStop(0, "rgba(220,235,255,1)");
  g.addColorStop(0.2, "rgba(150,200,255,0.7)");
  g.addColorStop(1, "rgba(150,200,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(ex, ey, 40 + Math.sin(t * 1.5) * 3, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, "Earth", ex, ey + 60, "center", 22, "rgba(200,220,255,0.75)");
  ctx.save();
  ctx.filter = "brightness(0.5) saturate(0.6)";
  at(ctx, 620, 640, 3.2, () => petals(ctx, 620, 640, 1));
  at(ctx, 960, 650, 3.6, () => rover(ctx, 960, 650, "Sojourner", 0));
  ctx.restore();
  vignette(ctx, 0.6);
}

function drawWater(ctx: C, t: number) {
  // long ago: water flowing through the valley, fading away to today's dry ground
  const k = 1 - ease((t - 4) / 3);
  if (k <= 0) return;
  for (let i = 0; i < 9; i++) {
    const y = VH * 0.62 + i * 34;
    ctx.strokeStyle = `rgba(120,190,255,${0.22 * k})`;
    ctx.lineWidth = 10 + i * 2;
    ctx.beginPath();
    for (let x = -40; x <= VW + 40; x += 20) {
      const yy = y + Math.sin(x / 120 + t * 2 + i) * 10;
      if (x === -40) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  label(ctx, "Long ago…", 80, 120, "left", 34, `rgba(158,230,250,${k})`);
}

function drawMeasure(ctx: C, t: number) {
  const a = ease((t - 1.2) / 1);
  if (a <= 0) return;
  ctx.globalAlpha = a;
  ctx.strokeStyle = "#5bd4f5";
  ctx.lineWidth = 3;
  const x = 470, top = 340, bottom = 610;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, bottom);
  ctx.moveTo(x - 14, top);
  ctx.lineTo(x + 14, top);
  ctx.moveTo(x - 14, bottom);
  ctx.lineTo(x + 14, bottom);
  ctx.stroke();
  ctx.fillStyle = "rgba(8,13,34,0.75)";
  ctx.fillRect(x - 210, (top + bottom) / 2 - 58, 190, 116);
  label(ctx, "≈ 30 cm", x - 115, (top + bottom) / 2 - 10, "center", 34, "#ffffff");
  label(ctx, "10.6 kg", x - 115, (top + bottom) / 2 + 36, "center", 28, "#9ee6fa");
  ctx.globalAlpha = 1;
}

function drawListen(ctx: C, t: number) {
  // faint rings: the antenna listening for a signal that never comes
  for (let i = 0; i < 3; i++) {
    const p = ((t * 0.35 + i / 3) % 1);
    ctx.strokeStyle = `rgba(158,230,250,${0.35 * (1 - p)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(VW * 0.5, VH * 0.35, 80 + p * 520, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
}

/** A real photo arriving from Mars: drawn in line by line, like the 1997 downlink. */
function drawTransmission(ctx: C, sc: Scene, t: number, im?: HTMLImageElement) {
  space(ctx, t, 1, "#060a1c");
  const reveal = ease(t / 2.4);
  if (ready(im)) {
    const maxW = VW * 0.74, maxH = VH * 0.56;
    const s = Math.min(maxW / im!.naturalWidth, maxH / im!.naturalHeight) * (1 + 0.04 * ease(t / 10));
    const w = im!.naturalWidth * s;
    const h = im!.naturalHeight * s;
    const x = (VW - w) / 2;
    const y = Math.max(110, (VH - h) / 2 - 110);
    ctx.fillStyle = "rgba(15,22,51,0.9)";
    ctx.fillRect(x - 14, y - 44, w + 28, h + 58);
    ctx.strokeStyle = "rgba(140,156,255,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 14, y - 44, w + 28, h + 58);
    label(ctx, `INCOMING · ${(sc.stamp ?? "Mars Pathfinder").toUpperCase()}`, x, y - 16, "left", 18, "#9ee6fa");
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h * reveal);
    ctx.clip();
    if (sc.gray) ctx.filter = "grayscale(1) contrast(1.08)";
    ctx.drawImage(im!, x, y, w, h);
    ctx.filter = "none";
    ctx.restore();
    if (reveal < 1) {
      const ly = y + h * reveal;
      const g = ctx.createLinearGradient(0, ly - 12, 0, ly + 2);
      g.addColorStop(0, "rgba(91,212,245,0)");
      g.addColorStop(1, "rgba(91,212,245,0.85)");
      ctx.fillStyle = g;
      ctx.fillRect(x, ly - 12, w, 14);
      label(ctx, `${Math.round(reveal * 100)}%`, x + w, y - 16, "right", 18, "#9ee6fa");
    } else {
      label(ctx, "RECEIVED", x + w, y - 16, "right", 18, "#4ade80");
    }
  }
}

/** Every image a film needs, so the player can load them up front. */
export function filmImages(scenes: Scene[]) {
  const set = new Set<string>(["/games/mars.webp", "/games/earth.webp"]);
  for (const s of scenes) if (s.image) set.add(s.image);
  return [...set];
}
