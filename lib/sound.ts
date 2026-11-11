"use client";

// Game sound effects, made in the browser with the Web Audio API (no audio files).
// Browsers only allow sound after a tap or key press, so the first call to `unlock()`
// must come from a click (for example the "Start" button). Muting is remembered.

const KEY = "cj-sound";
export const SOUND_EVENT = "cj-sound-changed";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let engine: { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;

export function isMuted() {
  try {
    return localStorage.getItem(KEY) === "off";
  } catch {
    return false;
  }
}

export function setMuted(off: boolean) {
  try {
    localStorage.setItem(KEY, off ? "off" : "on");
  } catch {}
  if (master && ctx) master.gain.setTargetAtTime(off ? 0 : 0.8, ctx.currentTime, 0.02);
  window.dispatchEvent(new Event(SOUND_EVENT));
}

/** Start (or resume) audio. Call from a click or key press. */
export function unlock() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = isMuted() ? 0 : 0.8;
    master.connect(ctx.destination);
    // two seconds of brown noise: the base of rumbles, hisses and thumps
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
}

const ready = () => (ctx && master && noise && !isMuted() ? ctx : null);

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.25, slideTo?: number) {
  const c = ready();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  const t = c.currentTime + start;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function burst(dur: number, freq: number, vol = 0.5, type: BiquadFilterType = "lowpass", start = 0) {
  const c = ready();
  if (!c) return;
  const s = c.createBufferSource();
  s.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = c.createGain();
  const t = c.currentTime + start;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master!);
  s.start(t, Math.random());
  s.stop(t + dur + 0.05);
}

/** Continuous engine rumble. level 0 = silent, 1 = full launch roar; bright = how much hiss. */
export function setEngine(level: number, bright = 0.5) {
  const c = ctx;
  if (!c || !master || !noise) return;
  if (!engine && level > 0.01) {
    const src = c.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    const gain = c.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(master);
    src.start();
    engine = { src, filter, gain };
  }
  if (!engine) return;
  const t = c.currentTime;
  engine.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * 0.9, t, 0.08);
  engine.filter.frequency.setTargetAtTime(160 + bright * 900, t, 0.1);
  if (level <= 0.01) {
    const e = engine;
    engine = null;
    window.setTimeout(() => {
      try {
        e.src.stop();
      } catch {}
    }, 400);
  }
}

export const sfx = {
  /** Countdown beep; `go` is the higher liftoff tone. */
  beep: (go = false) => tone(go ? 1046 : 660, 0, go ? 0.45 : 0.16, "sine", 0.22),
  /** Stage separation: a clunk and a puff of gas. */
  separate: () => {
    tone(140, 0, 0.18, "triangle", 0.35, 60);
    burst(0.35, 2500, 0.25, "highpass", 0.02);
  },
  /** Science data caught: a bright two-note chime. */
  data: () => {
    tone(880, 0, 0.18, "sine", 0.2);
    tone(1320, 0.09, 0.3, "sine", 0.18);
  },
  /** Repair kit: a quick rising arpeggio. */
  repair: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.06, 0.16, "triangle", 0.14)),
  /** Hit by a space rock: a crunch and a low thud. */
  hit: () => {
    burst(0.28, 900, 0.7);
    tone(110, 0, 0.3, "sine", 0.45, 45);
  },
  /** Soft thud on the ground (airbag bounce, touchdown); `v` is 0..1 loudness. */
  thud: (v = 1) => {
    burst(0.22, 300, 0.6 * v);
    tone(80, 0, 0.25, "sine", 0.35 * v, 40);
  },
  /** Parachute snapping open. */
  pop: () => {
    burst(0.12, 3500, 0.5, "bandpass");
    burst(0.6, 1200, 0.18, "highpass", 0.05);
  },
  /** Airbags inflating. */
  inflate: () => burst(0.7, 1800, 0.25, "highpass"),
  /** Something went wrong (tore, crashed, missed). */
  fail: () => {
    tone(330, 0, 0.22, "square", 0.08, 220);
    tone(220, 0.2, 0.4, "square", 0.08, 140);
  },
  /** Small click for a puzzle piece that fits. */
  click: () => tone(1500, 0, 0.06, "triangle", 0.18, 900),
  /** Wrong spot: a short low buzz. */
  buzz: () => tone(160, 0, 0.12, "square", 0.06),
  /** Mission complete fanfare. */
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.09, i === 4 ? 0.6 : 0.22, "triangle", 0.16)),
  /** Stop every continuous sound. */
  stopAll: () => setEngine(0),
};
