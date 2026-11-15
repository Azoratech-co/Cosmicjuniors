"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FlightMission } from "@/lib/mission-flights";
import ScrollPicker from "@/components/rovers/ScrollPicker";
import styles from "./FlightOrbit.module.css";

type Position = [number, number, number];
type Sample = [Position, Position, Position];
type Flight = {
  start: string;
  end: string;
  samples: Sample[];
  solarSamples?: Sample[];
  solarOrbitGuides?: [Position[], Position[]];
};

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const dateTimeFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium", timeStyle: "medium", hourCycle: "h23", timeZone: "UTC",
});

const initialView = { yaw: -0.2, tilt: 0.55, zoom: 1 };
const stars = Array.from({ length: 320 }, (_, index) => ({
  x: (index * 179.73 + index * index * 13.61) % 720,
  y: (index * 81.91 + index * index * 9.37) % 380,
  radius: index % 23 === 0 ? 1.1 : 0.55,
  opacity: 0.18 + (index % 7) * 0.083,
}));

function project(position: Position, { yaw, tilt, zoom }: typeof initialView, lunar: boolean) {
  const [x, y, z] = position;
  const centeredX = lunar ? x - 0.48 : x;
  const horizontal = centeredX * Math.cos(yaw) - y * Math.sin(yaw);
  const depth = centeredX * Math.sin(yaw) + y * Math.cos(yaw);
  const vertical = depth * Math.sin(tilt) + z * Math.cos(tilt);
  const scale = lunar ? 450 * zoom : (170 * zoom) / (1 + (depth * Math.cos(tilt) - z * Math.sin(tilt)) * 0.15);
  return [360 + horizontal * scale, 184 - vertical * scale];
}

function fitSolarView(view: typeof initialView, samples: Sample[], guides: [Position[], Position[]]) {
  const baseline = { ...view, zoom: 1 };
  let width = 0;
  let height = 0;
  for (const position of [...guides.flat(), ...samples.flat()]) {
    const [x, y] = project(position, baseline, false);
    width = Math.max(width, Math.abs(x - 360));
    height = Math.max(height, Math.abs(y - 184));
  }
  return { ...view, zoom: view.zoom * Math.min(1, 320 / width, 157 / height) };
}

function FlightMap({ flight, mission }: { flight: Flight; mission: FlightMission }) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState(initialView);
  const [earthCentered, setEarthCentered] = useState(true);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const id = useId();
  const lunar = mission.destination === "Moon";
  const hasSolarContext = !!flight.solarSamples;
  const closeUp = lunar && (earthCentered || !hasSolarContext);
  const samples = closeUp ? flight.samples : flight.solarSamples ?? flight.samples;
  const solarLunar = lunar && !closeUp;
  const guides = closeUp ? undefined : flight.solarOrbitGuides;
  const fittedView = useMemo(() => guides ? fitSolarView(view, samples, guides) : view, [view, samples, guides]);
  const markers = [
    { label: mission.spacecraftLabel ?? mission.name, color: "#eee0ff", radius: 5 },
    { label: "Earth", color: "#55caff", radius: 8 },
    { label: mission.destination, color: lunar ? "#e0dfd9" : "#ff9365", radius: 7 },
  ];
  const last = samples.length - 1;
  const index = Math.min(last, Math.floor(progress));
  const fraction = progress - index;
  const sample = samples[index];
  const next = samples[Math.min(last, index + 1)];
  const start = Date.parse(flight.start);
  const end = Date.parse(flight.end);
  const date = (lunar ? dateTimeFormat : dateFormat).format(start + (end - start) * progress / last);
  const paths = useMemo(() => samples[0].map((_, body) =>
    samples.map((point) => project(point[body], fittedView, closeUp).join(",")).join(" ")), [samples, fittedView, closeUp]);
  const guidePaths = useMemo(() => guides?.map((guide) =>
    guide.map((point) => project(point, fittedView, false).join(",")).join(" ")), [guides, fittedView]);
  const positions = sample.map((point, body) => project([
    point[0] + (next[body][0] - point[0]) * fraction,
    point[1] + (next[body][1] - point[1]) * fraction,
    point[2] + (next[body][2] - point[2]) * fraction,
  ], fittedView, closeUp));
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
      {hasSolarContext && <div className={styles.viewModes} role="group" aria-label="Flight scale">
        <button type="button" aria-pressed={closeUp} onClick={() => { setEarthCentered(true); setView(initialView); }}>Earth–Moon detail</button>
        <button type="button" aria-pressed={!closeUp} onClick={() => { setEarthCentered(false); setView(initialView); }}>Sun-centered view</button>
      </div>}
      <div className={styles.viewport}>
      <svg className={styles.map} viewBox="0 0 720 380" role="group"
        aria-label={`${mission.name} flight path. Drag or use the arrow keys to rotate the view.`}
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
        {!closeUp && <defs>
          <radialGradient id={`${id}-sun`}>
            <stop offset="0%" stopColor="#fff8b5" stopOpacity=".88" />
            <stop offset="22%" stopColor="#ffba4d" stopOpacity=".38" />
            <stop offset="100%" stopColor="#ff962e" stopOpacity="0" />
          </radialGradient>
        </defs>}
        <g aria-hidden="true">{stars.map(({ x, y, radius, opacity }, index) => (
          <circle key={index} cx={x} cy={y} r={radius} opacity={opacity} fill={index % 4 === 0 ? "#ffddac" : "#d8e5ff"} />
        ))}</g>
        {guidePaths && <g aria-hidden="true" data-orbit-guides>
          {guidePaths.map((path, index) => {
            const { label, color } = markers[index + 1];
            return <polyline key={label} points={path} fill="none" stroke={color} strokeWidth=".65" opacity=".38" />;
          })}
        </g>}
        {markers.map(({ label, color }, body) => (
          closeUp && body === 1 ? null : <polyline key={label} points={paths[body]}
            fill="none" stroke={body === 0 ? "#bb94ff" : color} strokeWidth={body === 0 ? 1.7 : 1}
            opacity={body === 0 ? 0.76 : 0.52} />
        ))}
        <polyline points={flownPath} fill="none" stroke="#aa70ff" strokeWidth="6" opacity=".20" />
        <polyline points={flownPath} fill="none" stroke="#e9d6ff" strokeWidth="2.3" />
        {!closeUp && <>
          <circle cx="360" cy="184" r="56" fill={`url(#${id}-sun)`} />
          <circle cx="360" cy="184" r="7" fill="#fff7be" />
          <text x="376" y="189">Sun</text>
        </>}
        {[1, 2, 0].map((body) => {
          const { label, color, radius } = markers[body];
          const [x, y] = positions[body];
          return <g key={label} transform={`translate(${x} ${y})`}>
            <circle r={radius + 4} fill={color} opacity=".13" />
            {body === 0
              ? <path d="M 0 -5 L 5 0 L 0 5 L -5 0 Z" fill="#161027" stroke={color} strokeWidth="1.6" />
              : <circle r={radius} fill="#0b0d16" stroke={color} strokeWidth="1.4" />}
            <text x={closeUp ? 0 : body === 0 || x > 590 ? -12 : 12} y={body === 0 ? -12 : solarLunar && body === 2 ? 36 : 18}
              textAnchor={closeUp ? "middle" : body === 0 || x > 590 ? "end" : "start"}>{label}</text>
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
          <button type="button" onClick={() => { setPlaying(false); setProgress(0); }}>{mission.startLabel ?? (lunar ? "Translunar injection" : "Departure")}</button>
          <button type="button" onClick={() => { setPlaying(false); setProgress(last); }}>{mission.endLabel ?? (lunar ? "Orbit insertion burn" : "Arrival")}</button>
        </div>
      </div>
    </>
  );
}

function Flight({ mission }: { mission: FlightMission }) {
  const [flight, setFlight] = useState<Flight | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const request = new AbortController();
    fetch(mission.file, { signal: request.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Flight data unavailable");
        return response.json() as Promise<Flight>;
      })
      .then(setFlight)
      .catch(() => { if (!request.signal.aborted) setFailed(true); });
    return () => request.abort();
  }, [mission.file]);

  return flight ? <FlightMap flight={flight} mission={mission} />
    : <p role="status">{failed ? "The flight path is unavailable." : "Loading flight path…"}</p>;
}

export default function FlightOrbit({ missions }: { missions: readonly [FlightMission, ...FlightMission[]] }) {
  const heading = useId();
  const [selected, setSelected] = useState(missions[0].file);
  const mission = missions.find(({ file }) => file === selected) ?? missions[0];
  const lunar = mission.destination === "Moon";
  return (
    <section className={styles.card} aria-labelledby={heading}>
      <h2 id={heading}>{missions.length > 1 ? "Eyes on the Apollo rover flights" : `Eyes on ${mission.name}’s ${lunar ? "flight" : "orbit"}`}</h2>
      <p>{lunar ? "Follow the spacecraft from Earth to the Moon." : "Follow the spacecraft from Earth to Mars."}</p>
      {missions.length > 1 && <div className={styles.missionPicker}>
        <h3>Mission</h3>
        <ScrollPicker fixedRows items={missions.map(({ name, file }) => ({ id: file, name }))}
          selected={mission.file} label="Scroll to choose a mission" onSelect={({ id }) => setSelected(id)} />
      </div>}
      <Flight key={mission.file} mission={mission} />
      <section className={styles.moreInfo} aria-labelledby={`${heading}-more`}>
        <h3 id={`${heading}-more`}>More information</h3>
        <p>{lunar
          ? mission.reconstruction ?? "The flight starts just after the spacecraft leaves Earth orbit during translunar injection. It ends when the engine fires to slow the spacecraft into lunar orbit. NASA recorded its position and speed at key points, and the simulation estimates the path between them."
          : <>{mission.reconstruction ?? "This cruise track starts about 78 minutes after liftoff and ends at Mars atmospheric entry."} Planet trails show their motion during the flight.</>}</p>
        <p>In the Sun-centered view, brighter lines show where Earth and {lunar ? "the Moon" : "Mars"} traveled during the flight. Thin lines complete their orbits around the Sun.{lunar && " The Earth and Moon tracks appear close together at this scale."}</p>
        <p>Markers are enlarged for visibility.</p>
        <div className={styles.sources}>
          <a href={mission.trajectory}>{lunar ? "NASA mission report" : "NASA/JPL trajectory data"}</a>
          <a href={mission.overview}>NASA mission overview</a>
          {lunar && !mission.reconstruction && <a href="https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_18-24_Translunar_Injection.htm">NASA translunar injection data</a>}
          <a href="https://ssd.jpl.nasa.gov/doc/de440_de441.html">JPL orbit data</a>
          {!lunar && <a href="https://science.nasa.gov/eyes/">NASA Eyes</a>}
        </div>
      </section>
    </section>
  );
}
