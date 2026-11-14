import { EDL, SAFE_RADIUS, PERFECT_RADIUS, canSteer, type PathfinderFlight } from "./pathfinderFlight";

export const FRAME_WIDTH = 1040;
export const FRAME_HEIGHT = 570;

const STORY = "/story/sojourner/";
const FLIGHT = "/games/pathfinder/";
const imagePaths = {
  mars: STORY + "mars.jpg",
  aerial: STORY + "orbit.jpg",
  terrain: STORY + "twin-peaks.jpg",
  landed: STORY + "landed.jpg",
  cruise: FLIGHT + "cruise-stage.webp",
  capsule: FLIGHT + "entry-capsule.webp",
  chute: FLIGHT + "parachute.webp",
  backshell: FLIGHT + "backshell.webp",
  lander: FLIGHT + "stowed-lander.webp",
  bags: FLIGHT + "airbags.webp",
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

function drawSprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, angle = 0, alpha = 1) {
  const height = width * image.height / image.width;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

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

function drawCanopy(ctx: CanvasRenderingContext2D, images: FlightImages, x: number, y: number, width: number, tilt: number,
  shellX: number, shellY: number) {
  for (let index = -3; index <= 3; index++) {
    drawTether(ctx, x + index * width * .095, y + width * (.26 - Math.abs(index) * .023), shellX, shellY);
  }
  drawSprite(ctx, images.chute, x, y, width, tilt);
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
  const planet = phase === "approach" ? smooth(stageTime / 7) : phase === "ready" || phase === "cruise" ? 0 : 1;
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
    if (phase === "approach" && stageTime > 5.25) {
      const separation = smooth((stageTime - 5.25) / .9);
      drawSprite(ctx, images.cruise, w * .51 - separation * 140, h * .31 - separation * 49, 124,
        -.14 - separation * .5, (1 - separation) * .82);
      drawSprite(ctx, images.capsule, w * .54, h * .33, 79, .54, separation);
    } else {
      drawSprite(ctx, images.cruise, w * .53, h * .33 + Math.sin(t * 1.2) * 4, 142, -.14 + Math.sin(t * .65) * .11);
    }
    return;
  }

  if (phase === "entry") {
    const x = w * .54 - smooth(stageTime / 6) * 23;
    const y = h * .35 + smooth(stageTime / 6) * 55;
    const heat = Math.sin(Math.PI * clamp(stageTime / 5.5));
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
    drawSprite(ctx, images.capsule, x, y, 72, .67);
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
    drawCanopy(ctx, images, shellX - sway * 1.35, shellY - 102, canopyWidth,
      -.11 + sway * .015 + Math.sin(t * 3.5) * .025, shellX, shellY - 4);
    if (bridle > 0) drawTether(ctx, shellX, shellY + 5, x, y);
    if (phase === "braking") drawExhaust(ctx, shellX, shellY + 9, t);
    if (phase === "chute" && flight.altitude > EDL.heatShield) {
      drawSprite(ctx, images.capsule, shellX, shellY, 34, sway * .018 + .46);
    } else {
      drawSprite(ctx, images.backshell, shellX, shellY, 37, sway * .008);
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
    if (bridle > 0 && !bags) drawSprite(ctx, images.lander, x, y, 29, sway * .017);
  }
  if (phase === "freefall" && stageTime < 1.5) {
    ctx.save();
    ctx.globalAlpha = 1 - stageTime / 1.5;
    const shellX = x + 87 + stageTime * 46;
    const shellY = y - 71 - stageTime * 60;
    drawCanopy(ctx, images, shellX + 21, shellY - 73, 99, .28 + stageTime * .35, shellX, shellY);
    drawSprite(ctx, images.backshell, shellX, shellY, 35, -.12);
    ctx.restore();
  }
  if (bags || (ground && flight.grade === "unsafe")) {
    const inflation = phase === "airbags" ? .43 + .57 * smooth(stageTime / .55) : 1;
    const rotation = phase === "bounce" && !reduced ? stageTime * 1.5 : sway * .005;
    ctx.save();
    ctx.filter = "saturate(.48) sepia(.25)";
    drawSprite(ctx, images.bags, x, y, 66 * inflation, rotation);
    ctx.restore();
  }
}
