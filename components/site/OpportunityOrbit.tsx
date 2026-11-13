"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./OpportunityOrbit.module.css";

type Position = [number, number, number];
type Sample = [Position, Position, Position];
type Flight = { start: string; end: string; samples: Sample[] };

const archive = "https://naif.jpl.nasa.gov/pub/naif/pds/data/mer1-m-spice-6-v1.0/mer1sp_1000/data/spk/";
const mission = "https://science.nasa.gov/mission/mer-opportunity/";
const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const markers = [
  { label: "Opportunity", color: "#eee0ff", radius: 5 },
  { label: "Earth", color: "#55caff", radius: 8 },
  { label: "Mars", color: "#ff9365", radius: 7 },
];

const initialView = { yaw: -0.2, tilt: 0.55, zoom: 1 };
const stars = Array.from({ length: 320 }, (_, index) => ({
  x: (index * 179.73 + index * index * 13.61) % 720,
  y: (index * 81.91 + index * index * 9.37) % 380,
  radius: index % 23 === 0 ? 1.1 : 0.55,
  opacity: 0.18 + (index % 7) * 0.083,
}));

function project([x, y, z]: Position, { yaw, tilt, zoom }: typeof initialView) {
  const horizontal = x * Math.cos(yaw) - y * Math.sin(yaw);
  const depth = x * Math.sin(yaw) + y * Math.cos(yaw);
  const vertical = depth * Math.sin(tilt) + z * Math.cos(tilt);
  const scale = (170 * zoom) / (1 + (depth * Math.cos(tilt) - z * Math.sin(tilt)) * 0.15);
  return [360 + horizontal * scale, 184 - vertical * scale];
}

function FlightMap({ flight }: { flight: Flight }) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState(initialView);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const id = useId();
  const last = flight.samples.length - 1;
  const index = Math.min(last, Math.floor(progress));
  const fraction = progress - index;
  const sample = flight.samples[index];
  const next = flight.samples[Math.min(last, index + 1)];
  const start = Date.parse(flight.start);
  const end = Date.parse(flight.end);
  const date = dateFormat.format(start + (end - start) * progress / last);
  const paths = useMemo(() => markers.map((_, body) =>
    flight.samples.map((point) => project(point[body], view).join(",")).join(" ")), [flight, view]);
  const positions = sample.map((point, body) => project([
    point[0] + (next[body][0] - point[0]) * fraction,
    point[1] + (next[body][1] - point[1]) * fraction,
    point[2] + (next[body][2] - point[2]) * fraction,
  ], view));
  const flownPath = paths[0].split(" ").slice(0, index + 1).concat(positions[0].join(",")).join(" ");

  function orbit(yaw: number, tilt: number) {
    setView((current) => ({ ...current, yaw: current.yaw + yaw, tilt: Math.max(0.2, Math.min(1.52, current.tilt + tilt)) }));
  }

  function zoom(factor: number) {
    setView((current) => ({ ...current, zoom: Math.max(0.65, Math.min(1.8, current.zoom * factor)) }));
  }

  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - previous;
      previous = now;
      setProgress((value) => (value + elapsed * last / 15000) % last);
    }, 33);
    return () => window.clearInterval(timer);
  }, [last, playing]);

  return (
    <>
      <div className={styles.viewport}>
      <svg className={styles.map} viewBox="0 0 720 380" role="group"
        aria-label="Opportunity flight path. Drag or use the arrow keys to rotate the view."
        tabIndex={0}
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return;
          drag.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current || !event.isPrimary) return;
          orbit((event.clientX - drag.current.x) * 0.007,
            event.pointerType === "touch" ? 0 : (event.clientY - drag.current.y) * 0.005);
          drag.current = { x: event.clientX, y: event.clientY };
        }}
        onLostPointerCapture={() => { drag.current = null; }}
        onKeyDown={(event) => {
          switch (event.key) {
            case "ArrowLeft": orbit(-0.14, 0); break;
            case "ArrowRight": orbit(0.14, 0); break;
            case "ArrowUp": orbit(0, 0.12); break;
            case "ArrowDown": orbit(0, -0.12); break;
            case "Home": setView(initialView); break;
            default: return;
          }
          event.preventDefault();
        }}>
        <defs>
          <radialGradient id={`${id}-sun`}>
            <stop offset="0%" stopColor="#fff8b5" stopOpacity=".88" />
            <stop offset="22%" stopColor="#ffba4d" stopOpacity=".38" />
            <stop offset="100%" stopColor="#ff962e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g aria-hidden="true">{stars.map(({ x, y, radius, opacity }, index) => (
          <circle key={index} cx={x} cy={y} r={radius} opacity={opacity} fill={index % 4 === 0 ? "#ffddac" : "#d8e5ff"} />
        ))}</g>
        {markers.map(({ label, color }, body) => (
          <polyline key={label} points={paths[body]}
            fill="none" stroke={body === 0 ? "#bb94ff" : color} strokeWidth={body === 0 ? 1.7 : 1}
            opacity={body === 0 ? 0.76 : 0.52} />
        ))}
        <polyline points={flownPath} fill="none" stroke="#aa70ff" strokeWidth="6" opacity=".20" />
        <polyline points={flownPath} fill="none" stroke="#e9d6ff" strokeWidth="2.3" />
        <circle cx="360" cy="184" r="56" fill={`url(#${id}-sun)`} />
        <circle cx="360" cy="184" r="7" fill="#fff7be" />
        <text x="376" y="189">Sun</text>
        {[1, 2, 0].map((body) => {
          const { label, color, radius } = markers[body];
          const [x, y] = positions[body];
          return <g key={label} transform={`translate(${x} ${y})`}>
            <circle r={radius + 4} fill={color} opacity=".13" />
            {body === 0
              ? <path d="M 0 -5 L 5 0 L 0 5 L -5 0 Z" fill="#161027" stroke={color} strokeWidth="1.6" />
              : <circle r={radius} fill="#0b0d16" stroke={color} strokeWidth="1.4" />}
            <text x={body === 0 || x > 590 ? -12 : 12} y={body === 0 ? -12 : 18}
              textAnchor={body === 0 || x > 590 ? "end" : "start"}>{label}</text>
          </g>;
        })}
      </svg>
      <div className={styles.camera} role="group" aria-label="Flight camera">
        <button type="button" aria-label="Zoom in on flight" onClick={() => zoom(1.17)}>+</button>
        <button type="button" aria-label="Zoom out of flight" onClick={() => zoom(1 / 1.17)}>−</button>
        <button type="button" onClick={() => setView(initialView)}>Reset view</button>
      </div>
      </div>
      <div className={styles.timeline}>
        <label>
          <span>Flight timeline</span>
          <input type="range" min={0} max={last} step={1} value={Math.round(progress)} aria-valuetext={date}
            onChange={(event) => { setPlaying(false); setProgress(Number(event.target.value)); }} />
        </label>
        <output>{date} UTC</output>
        <div className={styles.controls}>
          <button type="button" onClick={() => {
            if (!playing && progress >= last) setProgress(0);
            setPlaying(!playing);
          }}>{playing ? "Pause playback" : "Auto-play orbit"}</button>
          <button type="button" onClick={() => { setPlaying(false); setProgress(0); }}>Departure</button>
          <button type="button" onClick={() => { setPlaying(false); setProgress(last); }}>Arrival</button>
        </div>
      </div>
    </>
  );
}

export default function OpportunityOrbit() {
  const heading = useId();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const request = new AbortController();
    fetch("/models/mars/opportunity-flight.json", { signal: request.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Flight data unavailable");
        return response.json() as Promise<Flight>;
      })
      .then(setFlight)
      .catch(() => { if (!request.signal.aborted) setFailed(true); });
    return () => request.abort();
  }, []);

  return (
    <section className={styles.card} aria-labelledby={heading}>
      <h2 id={heading}>Eyes on Opportunity’s orbit</h2>
      <p>Follow the spacecraft from Earth to Mars.</p>
      {flight ? <FlightMap flight={flight} /> : <p role="status">{failed ? "The flight path is unavailable." : "Loading flight path…"}</p>}
      <p className={styles.note}>This cruise track starts about 78 minutes after liftoff and ends at Mars atmospheric entry. Planet trails show their motion during the flight. Markers are enlarged for visibility.</p>
      <div className={styles.sources}><a href={archive}>NASA/JPL trajectory data</a><a href={mission}>NASA mission overview</a><a href="https://science.nasa.gov/eyes/">NASA Eyes</a></div>
    </section>
  );
}
