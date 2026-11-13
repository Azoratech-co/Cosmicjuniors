"use client";

// Sound for the scrolling story, made in the browser with the Web Audio API (no audio files).
// Each scene names a preset: a mix of soft background beds (a hum, wind, a rocket's roar, a deep
// space drone, radio static) that crossfade as you scroll, plus a short sound when the scene
// arrives (the launch, the parachute, the bounces, the rover's motors, radio beeps).
// Browsers only allow sound after a tap or key press, so `enable()` must come from one.

type Bed = "hum" | "roar" | "drone" | "wind" | "gust" | "static";
type Cue = "chime" | "ignite" | "whoosh" | "inflate" | "bounces" | "rover" | "beeps" | "search" | "swell";

export type StorySoundPreset =
  | "card" | "cleanroom" | "launch" | "space" | "entry" | "chute" | "airbags" | "bounce" | "mars"
  | "rover" | "radio" | "sunset" | "listening" | "legacy" | "night";

const PRESETS: Record<StorySoundPreset, { beds: Partial<Record<Bed, number>>; cue?: Cue }> = {
  card: { beds: { drone: 0.35 }, cue: "chime" },
  cleanroom: { beds: { hum: 0.55 } },
  launch: { beds: { roar: 1 }, cue: "ignite" },
  space: { beds: { drone: 0.7 } },
  entry: { beds: { gust: 0.9, roar: 0.25 }, cue: "whoosh" },
  chute: { beds: { gust: 0.6 }, cue: "whoosh" },
  airbags: { beds: { wind: 0.5 }, cue: "inflate" },
  bounce: { beds: { wind: 0.5 }, cue: "bounces" },
  mars: { beds: { wind: 0.7 } },
  rover: { beds: { wind: 0.55 }, cue: "rover" },
  radio: { beds: { static: 0.45, drone: 0.25 }, cue: "beeps" },
  sunset: { beds: { wind: 0.45, drone: 0.4 } },
  listening: { beds: { static: 0.5, drone: 0.2 }, cue: "search" },
  legacy: { beds: { wind: 0.35, drone: 0.5 }, cue: "swell" },
  night: { beds: { wind: 0.3, drone: 0.45 } },
};

const BED_VOL: Record<Bed, number> = { hum: 0.22, roar: 0.55, drone: 0.12, wind: 0.32, gust: 0.42, static: 0.05 };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let brown: AudioBuffer | null = null;
let white: AudioBuffer | null = null;
const beds = new Map<Bed, GainNode>();
let on = false;
let duck = 1;
let current: StorySoundPreset | null = null;

function loopNoise(buf: AudioBuffer) {
  const s = ctx!.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.loopStart = Math.random();
  s.start();
  return s;
}
function lfo(freq: number, depth: number, target: AudioParam) {
  const o = ctx!.createOscillator();
  const g = ctx!.createGain();
  o.frequency.value = freq;
  g.gain.value = depth;
  o.connect(g).connect(target);
  o.start();
}

function makeBed(name: Bed) {
  const c = ctx!;
  const out = c.createGain();
  out.gain.value = 0;
  out.connect(master!);
  if (name === "hum") {
    // a clean room: mains hum and air handling
    for (const [f, v] of [[60, 0.5], [120, 0.18], [180, 0.06]] as const) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.value = f;
      g.gain.value = v;
      o.connect(g).connect(out);
      o.start();
    }
    const air = c.createBiquadFilter();
    air.type = "lowpass";
    air.frequency.value = 500;
    const ag = c.createGain();
    ag.gain.value = 0.8;
    loopNoise(brown!).connect(air).connect(ag).connect(out);
  } else if (name === "roar") {
    // a rocket: deep rumble plus crackle that flickers
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 260;
    const lg = c.createGain();
    lg.gain.value = 1.6;
    loopNoise(brown!).connect(lp).connect(lg).connect(out);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 0.6;
    const cg = c.createGain();
    cg.gain.value = 0.25;
    lfo(9, 0.18, cg.gain);
    loopNoise(white!).connect(bp).connect(cg).connect(out);
  } else if (name === "drone") {
    // deep space: a slow, soft chord
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    lp.connect(out);
    for (const [f, d] of [[110, 0], [164.81, 3], [246.94, -4], [329.63, 2]] as const) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      o.detune.value = d;
      g.gain.value = 0.22;
      lfo(0.05 + Math.random() * 0.08, 0.1, g.gain);
      o.connect(g).connect(lp);
      o.start();
    }
  } else if (name === "wind" || name === "gust") {
    // thin Martian wind (or the rush of entry), rising and falling in gusts
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = name === "wind" ? 420 : 950;
    bp.Q.value = name === "wind" ? 0.9 : 0.5;
    lfo(name === "wind" ? 0.07 : 0.23, name === "wind" ? 220 : 500, bp.frequency);
    const g = c.createGain();
    g.gain.value = 1.4;
    lfo(name === "wind" ? 0.11 : 0.3, 0.6, g.gain);
    loopNoise(name === "wind" ? brown! : white!).connect(bp).connect(g).connect(out);
  } else {
    // radio static
    const hp = c.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.value = 2400;
    hp.Q.value = 0.4;
    const g = c.createGain();
    g.gain.value = 1;
    lfo(0.5, 0.35, g.gain);
    loopNoise(white!).connect(hp).connect(g).connect(out);
  }
  beds.set(name, out);
}

// ---------- one-shot sounds ----------
function tone(freq: number, at: number, dur: number, vol: number, type: OscillatorType = "sine", to?: number) {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.05);
}
function burst(at: number, dur: number, vol: number, filter: BiquadFilterType, f0: number, f1: number, buf = brown!) {
  const c = ctx!;
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(f0, at);
  f.frequency.exponentialRampToValueAtTime(f1, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + Math.min(0.08, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f).connect(g).connect(master!);
  s.start(at, Math.random());
  s.stop(at + dur + 0.05);
}

function cue(name: Cue) {
  const t = ctx!.currentTime + 0.05;
  switch (name) {
    case "chime":
      tone(659.25, t, 2.4, 0.06);
      tone(987.77, t + 0.12, 2.2, 0.04);
      break;
    case "ignite":
      burst(t, 2.8, 1.2, "lowpass", 900, 120);
      tone(48, t, 2.5, 0.35, "sine", 32);
      break;
    case "whoosh":
      burst(t, 1.8, 0.7, "bandpass", 300, 2200, white!);
      break;
    case "inflate":
      burst(t, 1.6, 0.4, "highpass", 3000, 800, white!);
      burst(t + 0.2, 1.4, 0.5, "lowpass", 200, 700);
      break;
    case "bounces":
      // big thumps, each smaller than the last
      [0, 0.75, 1.35, 1.85, 2.25, 2.55, 2.8].forEach((d, i) => {
        const v = 0.9 * Math.pow(0.72, i);
        burst(t + d, 0.45, v, "lowpass", 260, 60);
        tone(70, t + d, 0.35, v * 0.5, "sine", 40);
      });
      break;
    case "rover":
      // small motors: two gentle whirs
      for (const d of [0.3, 1.6]) {
        tone(190, t + d, 0.9, 0.035, "sawtooth", 240);
        tone(380, t + d, 0.9, 0.012, "square", 470);
      }
      break;
    case "beeps":
      [0, 0.22, 1.2, 1.42].forEach((d) => tone(1046.5, t + d, 0.14, 0.05, "sine"));
      break;
    case "search":
      // the team listens: three call tones, and no answer
      [0, 1.4, 2.8].forEach((d) => tone(659.25, t + d, 0.5, 0.05, "sine", 640));
      break;
    case "swell":
      [261.63, 329.63, 392, 523.25].forEach((f, i) => tone(f, t + i * 0.08, 3.5, 0.035, "triangle"));
      break;
  }
}

function apply(fade: number) {
  if (!ctx) return;
  const p = current ? PRESETS[current] : null;
  for (const [name, g] of beds) {
    const level = on && p ? (p.beds[name] ?? 0) * BED_VOL[name] * duck : 0;
    g.gain.setTargetAtTime(level, ctx.currentTime, fade);
  }
}

/** Turn the story's sound on. Call from a click or key press. */
export function enableStorySound() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    // a gentle limiter so overlapping sounds never clip
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    master.connect(comp).connect(ctx.destination);
    const len = ctx.sampleRate * 4;
    brown = ctx.createBuffer(1, len, ctx.sampleRate);
    white = ctx.createBuffer(1, len, ctx.sampleRate);
    const b = brown.getChannelData(0);
    const w = white.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const r = Math.random() * 2 - 1;
      w[i] = r * 0.5;
      last = (last + 0.02 * r) / 1.02;
      b[i] = last * 3.5;
    }
    (["hum", "roar", "drone", "wind", "gust", "static"] as Bed[]).forEach(makeBed);
  }
  if (ctx.state === "suspended") void ctx.resume();
  on = true;
  apply(0.6);
  if (current && PRESETS[current].cue) cue(PRESETS[current].cue!);
}

export function disableStorySound() {
  on = false;
  apply(0.15);
  if (ctx) setTimeout(() => !on && ctx?.state === "running" && void ctx.suspend(), 800);
}

/** The scene on screen changed: crossfade to its sounds and play its arrival sound once. */
export function setStorySound(preset: StorySoundPreset | undefined) {
  const next = preset ?? null;
  if (next === current) return;
  current = next;
  if (!on || !ctx) return;
  apply(0.9);
  const c = next ? PRESETS[next].cue : undefined;
  if (c) cue(c);
}

/** Quieter beds while a narrated line plays. */
export function duckStorySound(quiet: boolean) {
  duck = quiet ? 0.45 : 1;
  apply(0.4);
}
