import { EDL, SAFE_RADIUS, PERFECT_RADIUS, canSteer, type PathfinderFlight } from "./pathfinderFlight";
import { airbags, backshell, capsule } from "./marsArt";

export const FRAME_WIDTH = 1040;
export const FRAME_HEIGHT = 570;

const STORY = "/story/sojourner/";
const imagePaths = {
  mars: STORY + "mars.jpg",
  aerial: STORY + "orbit.jpg",
  terrain: STORY + "twin-peaks.jpg",
  landed: STORY + "landed.jpg",
};

type FlightImages = Record<keyof typeof imagePaths, HTMLImageElement>;

export async function loadFlightImages(): Promise<FlightImages> {
  const images = await Promise.all(Object.entries(imagePaths).map(async ([key, path]) => {
    const image = new Image();
    image.src = path;
    await image.decode();
    return [key, image] as const;
  }));
  return Object.fromEntries(images) as FlightImages;
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const random = (n: number) => { const v = Math.sin(n * 78.233) * 43758.5453; return v - Math.floor(v); };

const stars = Array.from({ length: 1450 }, (_, index) => {
  const seed = index + 1;
  const light = random(seed * 7.7);
  return {
    x: random(seed * 3.3) * FRAME_WIDTH,
    y: random(seed * 5.9) * FRAME_HEIGHT,
    alpha: 0.16 + light * 0.63,
    size: light > 0.985 ? 2 : light > 0.93 ? 1.35 : 0.8,
    color: seed % 5 === 0 ? "#eacdb6" : "#d9e5ff",
  };
});

function drawStars(ctx: CanvasRenderingContext2D, time: number, density: number) {
  if (density < 0.005) return;
  stars.forEach(({ x, y, alpha, size, color }, index) => {
    ctx.globalAlpha = alpha * (0.84 + 0.16 * Math.sin(time * 1.1 + index)) * density;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
  });
  ctx.globalAlpha = 1;
}

function drawMars(ctx: CanvasRenderingContext2D, photo: HTMLImageElement, amount: number, alpha: number) {
  if (alpha < 0.005 || amount === 0) return;
  const radius = 880;
  const cx = FRAME_WIDTH * 0.53;
  const limb = FRAME_HEIGHT + 20 - amount * 294;
  const cy = limb + radius;
  const halo = ctx.createRadialGradient(cx, cy, radius - 2, cx, cy, radius + 43);
  halo.addColorStop(0, "rgba(243,144,98,.55)");
  halo.addColorStop(.25, "rgba(239,128,78,.18)");
  halo.addColorStop(1, "rgba(239,128,78,0)");
  ctx.globalAlpha = alpha * Math.min(1, amount * 2);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(photo, cx - radius, cy - radius, radius * 2, radius * 2);
  const shadow = ctx.createLinearGradient(0, limb, 0, FRAME_HEIGHT);
  shadow.addColorStop(0, "rgba(20,8,13,.12)");
  shadow.addColorStop(1, "rgba(17,7,11,.60)");
  ctx.fillStyle = shadow;
  ctx.fillRect(0, limb, FRAME_WIDTH, FRAME_HEIGHT - limb);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawAerial(ctx: CanvasRenderingContext2D, photo: HTMLImageElement, alpha: number) {
  if (alpha < .005) return;
  ctx.save();
  ctx.translate(0, 302);
  for (let row = 0; row < 28; row++) {
    const near = row / 28;
    const next = (row + 1) / 28;
    const startY = 270 * near * near;
    const endY = 270 * next * next;
    const sourceWidth = photo.width * (.87 - near * .45);
    ctx.globalAlpha = alpha * smooth((startY + 2) / 55);
    ctx.drawImage(photo, (photo.width - sourceWidth) / 2, photo.height * (.17 + near * .71),
      sourceWidth, photo.height * .71 / 28, 0, startY, FRAME_WIDTH, endY - startY + 1);
  }
  ctx.globalAlpha = alpha * .7;
  ctx.globalCompositeOperation = "multiply";
  const dust = ctx.createLinearGradient(0, 0, 0, 270);
  dust.addColorStop(0, "rgba(165,117,84,0)");
  dust.addColorStop(.23, "#ac7550");
  dust.addColorStop(1, "#805638");
  ctx.fillStyle = dust;
  ctx.fillRect(0, 0, FRAME_WIDTH, 270);
  ctx.restore();
}

function drawTerrain(ctx: CanvasRenderingContext2D, photo: HTMLImageElement, amount: number, drift: number) {
  if (amount < 0.005) return;
  ctx.globalAlpha = amount;
  const offset = Math.max(-23, Math.min(23, drift * -.13));
  // Crop the old camera mosaic's left join. The rock field comes from the storyline photo.
  const horizon = 320 - amount * 50;
  ctx.drawImage(photo, photo.width * .07, photo.height * .48, photo.width * .92, photo.height * .51,
    -29 + offset, horizon - 31, FRAME_WIDTH + 58, FRAME_HEIGHT - horizon + 31);
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#0d101d");
  sky.addColorStop(.48, "#413136");
  sky.addColorStop(.88, "#756048");
  sky.addColorStop(1, "rgba(125,103,75,0)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FRAME_WIDTH, horizon + 1);
  ctx.globalAlpha = 1;
}

// ---------- the spacecraft, drawn in code so they stay sharp at any size ----------
type Pose = { x: number; y: number; size: number; angle?: number; alpha?: number };
function posed(ctx: CanvasRenderingContext2D, { x, y, size, angle = 0, alpha = 1 }: Pose, draw: () => void) {
  if (alpha < .005) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  ctx.globalAlpha *= alpha;
  draw();
  ctx.restore();
}

/** Cruise stage: a flat ring of solar cells with the entry capsule (aeroshell) on its front. */
function drawCruise(ctx: CanvasRenderingContext2D, pose: Pose, time: number) {
  posed(ctx, pose, () => {
    ctx.save();
    ctx.scale(1, .42);
    const ring = ctx.createLinearGradient(-60, -60, 60, 60);
    ring.addColorStop(0, "#2a3558");
    ring.addColorStop(.5, "#1a2240");
    ring.addColorStop(1, "#0f1428");
    ctx.fillStyle = "#c9ccd2";
    ctx.beginPath(); ctx.arc(0, 0, 62, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ring;
    ctx.beginPath(); ctx.arc(0, 0, 59, 0, Math.PI * 2); ctx.arc(0, 0, 25, 0, Math.PI * 2, true); ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(170,190,230,.32)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 26); ctx.lineTo(Math.cos(a) * 58, Math.sin(a) * 58); ctx.stroke();
    }
    for (const r of [36, 47]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
    // a glint of sunlight sweeping over the cells
    ctx.fillStyle = `rgba(200,220,255,${.10 + .08 * Math.sin(time * 1.3)})`;
    ctx.beginPath(); ctx.ellipse(-22, -24, 30, 12, -.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // the capsule sits in the middle, its backshell facing us
    ctx.save();
    ctx.translate(0, -4);
    ctx.scale(.62, .62);
    capsule(ctx, 0, 0, time * 1000, 0, true, 0, Math.PI);
    ctx.restore();
  });
}

/** Disk-gap-band parachute seen from the side, orange and white gores. */
function drawChute(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, tilt: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  const w = width / 2, h = width * .34;
  const gores = 10;
  for (let i = 0; i < gores; i++) {
    const a0 = Math.PI + (i / gores) * Math.PI, a1 = Math.PI + ((i + 1) / gores) * Math.PI;
    ctx.fillStyle = i % 2 ? "#f3efe6" : "#d4622f";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.ellipse(0, 0, w, h, 0, a0, a1); ctx.closePath(); ctx.fill();
  }
  // the gap between the disk and the band
  ctx.fillStyle = "rgba(10,12,20,.55)";
  ctx.beginPath(); ctx.ellipse(0, -h * .38, w * .93, h * .07, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.beginPath(); ctx.ellipse(0, 0, w, h * .12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** The folded lander (a small tetrahedron wrapped in gold blanket) before its airbags inflate. */
function drawLander(ctx: CanvasRenderingContext2D, pose: Pose) {
  posed(ctx, pose, () => {
    const g = ctx.createLinearGradient(-14, 0, 14, 0);
    g.addColorStop(0, "#8a6a2a"); g.addColorStop(.45, "#e4c072"); g.addColorStop(1, "#7a5b22");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(14, 10); ctx.lineTo(-14, 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(60,40,10,.6)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, 10); ctx.stroke();
  });
}

const drawCapsule = (ctx: CanvasRenderingContext2D, pose: Pose, time: number, heat = 0) =>
  posed(ctx, pose, () => capsule(ctx, 0, 0, time * 1000, 0, true, heat, 0));
const drawBackshell = (ctx: CanvasRenderingContext2D, pose: Pose, time: number, burning = false) =>
  posed(ctx, pose, () => backshell(ctx, 0, 0, burning, time * 1000));
const drawBags = (ctx: CanvasRenderingContext2D, pose: Pose, spin: number) =>
  posed(ctx, pose, () => airbags(ctx, 0, 0, 1, spin));

function drawLandingZone(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number, groundPoint: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, .35);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "#ff9b51";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(239,113,32,.14)";
  ctx.strokeStyle = "#ffac66";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.65;
  ctx.strokeStyle = "#ffdfac";
  ctx.beginPath();
  ctx.arc(0, 0, radius * PERFECT_RADIUS / SAFE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  if (groundPoint) {
    ctx.fillStyle = "#fff1d5";
    ctx.fillRect(-12, -1.3, 24, 2.6);
    ctx.fillRect(-1.3, -13, 2.6, 26);
  }
  ctx.restore();
}

function drawTether(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
  ctx.strokeStyle = "rgba(247,223,190,.88)";
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

function drawCanopy(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, tilt: number,
  shellX: number, shellY: number) {
  for (let index = -3; index <= 3; index++) {
    drawTether(ctx, x + index * width * .07, y + 2, shellX, shellY);
  }
  drawChute(ctx, x, y, width, tilt);
}

function drawExhaust(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const offset of [-9, 0, 9]) {
    const length = 36 + 14 * Math.sin(time * 40 + offset);
    const g = ctx.createLinearGradient(0, y, 0, y + length);
    g.addColorStop(0, "#ffeed4");
    g.addColorStop(.19, "#ffb570");
    g.addColorStop(1, "rgba(210,141,96,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + offset - 2, y);
    ctx.lineTo(x + offset + 2, y);
    ctx.lineTo(x + offset * 1.6 + 5, y + length);
    ctx.lineTo(x + offset * 1.6 - 5, y + length);
    ctx.fill();
  }
  ctx.restore();
}

function drawDust(ctx: CanvasRenderingContext2D, t: number, wind: number, opacity: number) {
  ctx.strokeStyle = "#eec08b";
  ctx.lineWidth = 1;
  for (let index = 1; index < 39; index++) {
    const x = ((random(index * 2.6) * FRAME_WIDTH + t * random(index) * wind * 20) % FRAME_WIDTH + FRAME_WIDTH) % FRAME_WIDTH;
    const y = 315 + random(index * 7.4) * 250;
    ctx.globalAlpha = opacity * (.08 + random(index * 3.1) * .28);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + wind * (2 + random(index * 4.5) * 3), y - 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawFlight(ctx: CanvasRenderingContext2D, images: FlightImages, flight: PathfinderFlight, reduced: boolean) {
  const phase = flight.phase;
  const t = reduced ? 0 : flight.elapsed;
  const stageTime = flight.stageTime;
  const touchdown = phase === "success";
  const ground = phase === "bounce" || phase === "failure";
  const lowAltitude = canSteer(flight) || phase === "braking" || phase === "freefall" || ground;
  const terrain = lowAltitude ? smooth(1 - flight.altitude / 4600) : 0;
  const planet = phase === "approach" ? smooth(stageTime / 5.5) : phase === "ready" || phase === "cruise" ? 0 : 1;
  const w = FRAME_WIDTH;
  const h = FRAME_HEIGHT;

  const sky = ctx.createRadialGradient(w * .62, h * .34, 12, w * .62, h * .34, w * .67);
  sky.addColorStop(0, "#101322");
  sky.addColorStop(.53, "#070a13");
  sky.addColorStop(1, "#03050a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  if (touchdown) {
    const photo = images.landed;
    const scale = Math.max(w / photo.width, h / photo.height);
    ctx.drawImage(photo, (w - photo.width * scale) / 2, h - photo.height * scale, photo.width * scale, photo.height * scale);
    ctx.fillStyle = "rgba(14,11,12,.16)";
    ctx.fillRect(0, 0, w, h);
    drawLandingZone(ctx, w * .50, h * .88, 230, .72, false);
    return;
  }

  const aerialBlend = phase === "chute" ? smooth(stageTime / 2.4) : lowAltitude ? 1 : 0;
  drawStars(ctx, t, 1 - Math.max(terrain, aerialBlend * .72) * .97);
  drawMars(ctx, images.mars, planet, 1 - aerialBlend);
  drawAerial(ctx, images.aerial, aerialBlend * (1 - terrain));
  drawTerrain(ctx, images.terrain, terrain, flight.x);
  if (terrain > .05) drawDust(ctx, t, flight.wind, terrain);

  const envelope = ctx.createRadialGradient(w * .52, h * .5, h * .29, w * .52, h * .5, w * .66);
  envelope.addColorStop(0, "rgba(2,4,10,0)");
  envelope.addColorStop(1, "rgba(2,4,10,.68)");
  ctx.fillStyle = envelope;
  ctx.fillRect(0, 0, w, h);

  if (phase === "ready" || phase === "cruise" || phase === "approach") {
    if (phase === "approach" && stageTime > 3.9) {
      const separation = smooth((stageTime - 3.9) / .9);
      drawCruise(ctx, { x: w * .51 - separation * 140, y: h * .31 - separation * 49, size: 1.0, angle: -.14 - separation * .5, alpha: (1 - separation) * .9 }, t);
      drawCapsule(ctx, { x: w * .54, y: h * .33, size: .95, angle: .54, alpha: separation }, t);
    } else {
      drawCruise(ctx, { x: w * .53, y: h * .33 + Math.sin(t * 1.2) * 4, size: 1.15, angle: -.14 + Math.sin(t * .65) * .11 }, t);
    }
    return;
  }

  if (phase === "entry") {
    const x = w * .54 - smooth(stageTime / 5) * 23;
    const y = h * .35 + smooth(stageTime / 5) * 55;
    const heat = Math.sin(Math.PI * clamp(stageTime / 4.6));
    if (heat > 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(.67);
      const plasma = ctx.createRadialGradient(0, 12, 4, 0, 12, 70);
      plasma.addColorStop(0, "rgba(255,206,126,.85)");
      plasma.addColorStop(.34, "rgba(240,115,57,.48)");
      plasma.addColorStop(1, "rgba(234,72,38,0)");
      ctx.globalAlpha = heat;
      ctx.fillStyle = plasma;
      ctx.fillRect(-73, -71, 146, 150);
      ctx.restore();
    }
    drawCapsule(ctx, { x, y, size: 1, angle: .67 }, t, heat);
    return;
  }

  const targetProgress = clamp(1 - Math.log(1 + flight.altitude / 50) / Math.log(1 + EDL.chute / 50));
  const groundScale = .58 + targetProgress * .8;
  const targetX = w * .52;
  const targetY = 445;
  const groundY = targetY - flight.depth * groundScale * .35;
  const x = targetX + flight.x * groundScale;
  const altitudeLift = ground ? flight.bounceHeight : 185 * Math.log(1 + flight.altitude / 24) / Math.log(1 + EDL.chute / 24);
  const y = groundY - altitudeLift - (ground ? 17 : 13);
  drawLandingZone(ctx, targetX, targetY, SAFE_RADIUS * groundScale, .78 + targetProgress * .22, true);
  if (!ground) {
    ctx.fillStyle = "rgba(16,11,9,.52)";
    ctx.beginPath();
    ctx.ellipse(x, groundY, 10 + targetProgress * 8, 4 + targetProgress * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,231,199,.83)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, groundY, 4.4, 0, Math.PI * 2);
    ctx.stroke();
  }

  const sway = reduced ? 0 : flight.wind * 2.2 + Math.sin(t * 2.35) * 5;
  const bags = phase === "airbags" || phase === "braking" || phase === "freefall" || phase === "bounce" || flight.grade === "missed";
  if (canSteer(flight) || phase === "braking") {
    const bridle = phase === "chute" ? 0 : 52 * smooth(phase === "bridle" ? stageTime / 1.8 : 1);
    const shellX = x - sway * .25;
    const shellY = y - bridle;
    const canopyWidth = 127 * (phase === "chute" ? .28 + .72 * smooth(stageTime / 1.3) : 1);
    drawCanopy(ctx, shellX - sway * 1.35, shellY - 102, canopyWidth,
      -.11 + sway * .015 + Math.sin(t * 3.5) * .025, shellX, shellY - 4);
    if (bridle > 0) drawTether(ctx, shellX, shellY + 5, x, y);
    if (phase === "braking") drawExhaust(ctx, shellX, shellY + 9, t);
    if (phase === "chute" && flight.altitude > EDL.heatShield) {
      drawCapsule(ctx, { x: shellX, y: shellY, size: .5, angle: sway * .018 }, t);
    } else {
      drawBackshell(ctx, { x: shellX, y: shellY, size: .4, angle: sway * .008 }, t, phase === "braking");
    }
    if (phase === "chute" && flight.altitude <= EDL.heatShield) {
      const fall = (EDL.heatShield - flight.altitude) / (EDL.heatShield - EDL.bridle);
      ctx.save();
      ctx.globalAlpha = 1 - smooth(fall);
      ctx.fillStyle = "#966748";
      ctx.beginPath();
      ctx.ellipse(shellX + 12 + fall * 36, shellY + 22 + fall * 84, 14, 4, .04 + fall, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (bridle > 0 && !bags) drawLander(ctx, { x, y, size: 1, angle: sway * .017 });
  }
  if (phase === "freefall" && stageTime < 1.5) {
    ctx.save();
    ctx.globalAlpha = 1 - stageTime / 1.5;
    const shellX = x + 87 + stageTime * 46;
    const shellY = y - 71 - stageTime * 60;
    drawCanopy(ctx, shellX + 21, shellY - 73, 99, .28 + stageTime * .35, shellX, shellY);
    drawBackshell(ctx, { x: shellX, y: shellY, size: .38, angle: -.12 }, t);
    ctx.restore();
  }
  if (bags || (ground && flight.grade === "unsafe")) {
    const inflation = phase === "airbags" ? .43 + .57 * smooth(stageTime / .55) : 1;
    const rotation = phase === "bounce" && !reduced ? stageTime * 1.5 : sway * .005;
    drawBags(ctx, { x, y, size: .7 * inflation, angle: 0 }, rotation);
  }
}
