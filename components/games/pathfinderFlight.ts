export type FlightPhase = "ready" | "cruise" | "approach" | "entry" | "chute" | "bridle" | "airbags" | "braking" | "freefall" | "bounce" | "success" | "failure";
export type FlightControl = "left" | "right" | "up" | "down" | "stabilize";
export type LandingGrade = "perfect" | "safe" | "missed" | "unsafe";

export const PERFECT_RADIUS = 17;
export const SAFE_RADIUS = 62;
// Altitudes below are game cues based on the reconstructed Pathfinder flight sequence.
// Time, wind, steering authority, bounce height and scoring are tuned for play.
export const EDL = {
  entry: 130_000,
  chute: 9400,
  heatShield: 7300,
  bridle: 5100,
  airbags: 355,
  rockets: 98,
  release: 21.5,
} as const;

const stages: Partial<Record<FlightPhase, { duration: number; from: number; to: number }>> = {
  cruise: { duration: 3, from: 0, to: 0 },
  approach: { duration: 5.5, from: 3_000_000, to: EDL.entry },
  entry: { duration: 5, from: EDL.entry, to: EDL.chute },
  chute: { duration: 7, from: EDL.chute, to: EDL.bridle },
  bridle: { duration: 16, from: EDL.bridle, to: EDL.airbags },
  airbags: { duration: 8, from: EDL.airbags, to: EDL.release },
  braking: { duration: 1.7, from: EDL.rockets, to: EDL.release },
  freefall: { duration: 1.7, from: EDL.release, to: 0 },
  bounce: { duration: 3.1, from: 0, to: 0 },
};

export interface PathfinderFlight {
  phase: FlightPhase;
  elapsed: number;
  stageTime: number;
  altitude: number;
  wind: number;
  x: number;
  depth: number;
  vx: number;
  vz: number;
  rocketsFrom: number;
  bounceHeight: number;
  grade: LandingGrade | null;
}

export function freshFlight(): PathfinderFlight {
  return {
    phase: "ready", elapsed: 0, stageTime: 0, altitude: 0, wind: 0,
    x: -103, depth: 48, vx: 0, vz: 0, rocketsFrom: EDL.rockets, bounceHeight: 0, grade: null,
  };
}

export function switchPhase(flight: PathfinderFlight, phase: FlightPhase) {
  flight.phase = phase;
  flight.stageTime = 0;
  if (stages[phase]) flight.altitude = stages[phase].from;
}

export function isFlying(flight: PathfinderFlight) {
  return flight.phase !== "ready" && flight.phase !== "success" && flight.phase !== "failure";
}

export function canSteer(flight: PathfinderFlight) {
  return flight.phase === "chute" || flight.phase === "bridle" || flight.phase === "airbags";
}

export function canFire(flight: PathfinderFlight) {
  return flight.phase === "airbags";
}

export function inBrakeWindow(altitude: number) {
  return altitude <= 125 && altitude >= 72;
}

export function startBraking(flight: PathfinderFlight) {
  if (!canFire(flight)) return;
  if (!inBrakeWindow(flight.altitude)) {
    flight.grade = "unsafe";
    switchPhase(flight, "failure");
    return;
  }
  flight.rocketsFrom = flight.altitude;
  switchPhase(flight, "braking");
  flight.altitude = flight.rocketsFrom;
}

function gradeLanding(distance: number): LandingGrade {
  if (distance <= PERFECT_RADIUS) return "perfect";
  return distance <= SAFE_RADIUS ? "safe" : "missed";
}

export function advanceFlight(flight: PathfinderFlight, controls: ReadonlySet<FlightControl>, dt: number) {
  const stage = stages[flight.phase];
  if (!stage) return;

  flight.elapsed += dt;
  flight.stageTime = Math.min(flight.stageTime + dt, stage.duration);
  const fraction = flight.stageTime / stage.duration;
  const start = flight.phase === "braking" ? flight.rocketsFrom : stage.from;
  const descent = flight.phase === "freefall" ? fraction * fraction : fraction;
  flight.altitude = start + (stage.to - start) * descent;

  if (canSteer(flight)) {
    const gust = Math.sin(flight.elapsed * 0.77) * 0.7 + Math.sin(flight.elapsed * 1.9) * 0.3;
    flight.wind = 3 + 7 * gust;
    const horizontal = Number(controls.has("right")) - Number(controls.has("left"));
    const depth = Number(controls.has("up")) - Number(controls.has("down"));
    const damping = controls.has("stabilize") ? 4.8 : 1.55;
    flight.vx += (horizontal * 22 + flight.wind - damping * flight.vx) * dt;
    flight.vz += (depth * 18 - flight.wind * 0.22 - damping * flight.vz) * dt;
    flight.x = Math.max(-295, Math.min(295, flight.x + flight.vx * dt));
    flight.depth = Math.max(-210, Math.min(210, flight.depth + flight.vz * dt));
  } else if (flight.phase === "braking" || flight.phase === "freefall") {
    flight.vx *= Math.exp(-1.2 * dt);
    flight.vz *= Math.exp(-1.2 * dt);
    flight.x += flight.vx * dt;
    flight.depth += flight.vz * dt;
  } else if (flight.phase === "bounce") {
    flight.bounceHeight = Math.abs(Math.sin(flight.stageTime * 8)) * (1 - fraction) * 22;
  }

  if (fraction < 1) return;
  switch (flight.phase) {
    case "cruise": switchPhase(flight, "approach"); break;
    case "approach": switchPhase(flight, "entry"); break;
    case "entry": switchPhase(flight, "chute"); break;
    case "chute": switchPhase(flight, "bridle"); break;
    case "bridle": switchPhase(flight, "airbags"); break;
    case "airbags":
      flight.grade = "unsafe";
      switchPhase(flight, "failure");
      break;
    case "braking": switchPhase(flight, "freefall"); break;
    case "freefall": switchPhase(flight, "bounce"); break;
    case "bounce":
      flight.grade = gradeLanding(Math.hypot(flight.x, flight.depth));
      switchPhase(flight, flight.grade === "missed" ? "failure" : "success");
      break;
  }
}
