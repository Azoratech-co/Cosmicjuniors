// Mars hardware drawings shared by Mars Landing and the story film: entry capsule, parachute,
// backshell, airbags, lander petals, Viking/InSight landers, the sky crane, rovers and boulders.

import { flame } from "./art";

/** Drawing scale for spacecraft and rovers. */
export const S = 1.7;

export const hash = (n: number) => {
  const v = Math.sin(n * 127.1) * 43758.5453;
  return v - Math.floor(v);
};

export function boulder(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) {
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
export function capsule(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, chute: number, shield: boolean, heat: number, tilt = 0) {
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
export function chuteAbove(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, open: number) {
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

export function backshell(ctx: CanvasRenderingContext2D, x: number, y: number, burning: boolean, t: number) {
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
export function airbags(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, spin: number) {
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
export function petals(ctx: CanvasRenderingContext2D, x: number, y: number, open: number) {
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
export function lander(ctx: CanvasRenderingContext2D, x: number, y: number, insight: boolean, burning: boolean, t: number, broken: boolean) {
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
export function descentStage(ctx: CanvasRenderingContext2D, x: number, y: number, burning: boolean, t: number) {
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
export function rover(ctx: CanvasRenderingContext2D, x: number, y: number, name: string, spin: number) {
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
