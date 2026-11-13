"use client";

import { useId, useMemo, useState } from "react";
import { closestStopIndex, detailedCoordinates, getJourneyDefinition, getRouteSnapshot, regionalPoint, solRange, type JourneyData, type SurfacePoint } from "@/lib/mars-journeys";
import type { MarsRoverSite as Site } from "@/lib/landing-sites";
import styles from "./MarsJourneyPanel.module.css";

type Props = { site: Site; data?: JourneyData; loading: boolean; failed: boolean; retry: () => void };

function RegionalRoute({ site, data }: { site: Site; data: JourneyData }) {
  const definition = getJourneyDefinition(site.id);
  const [record, setRecord] = useState<number | null>(null);
  const [landmarkIndex, setLandmarkIndex] = useState<number | null>(null);
  const title = useId();
  const index = Math.min(data.stops.length - 1, record ?? data.stops.length - 1);
  const current = data.stops[index];
  const plot = useMemo(() => {
    const origin = data.stops[0];
    const lines = data.segments.map((segment) => segment.map((point) => regionalPoint(point, origin)));
    const all = [...lines.flat(), ...data.stops.map((point) => regionalPoint(point, origin))];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of all) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    const scale = Math.min(850 / Math.max(1, maxX - minX), 530 / Math.max(1, maxY - minY));
    const project = (point: SurfacePoint) => {
      const [x, y] = regionalPoint(point, origin);
      return [500 + (x - (minX + maxX) / 2) * scale, 330 - (y - (minY + maxY) / 2) * scale];
    };
    const path = data.segments.map((line) => line.map((point, i) => `${i ? "L" : "M"}${project(point).map((v) => v.toFixed(2)).join(",")}`).join(" ")).join(" ");
    const scaleMeters = Math.max(10, 10 ** Math.floor(Math.log10(160 / scale)));
    return { project, path, scale, scaleMeters };
  }, [data]);
  const start = plot.project(data.stops[0]);
  const end = plot.project(data.stops[data.stops.length - 1]);
  const cursor = plot.project(current);
  const landmark = landmarkIndex === null ? null : definition.landmarks[landmarkIndex];

  function chooseRecord(value: number) { setRecord(Math.max(0, Math.min(data.stops.length - 1, Math.round(value)))); setLandmarkIndex(null); }
  return (
    <>
      <div className={styles.mapColumn}>
        <div className={styles.mapHeading}><h3>{site.rover} · recorded route</h3><span>{data.snapshotDate} snapshot</span></div>
        <svg className={styles.map} viewBox="0 0 1000 700" role="img" aria-labelledby={title}>
          <title id={title}>{site.rover} regional traverse, north up. Ring: first mapped position. Diamond: last published position. White dot: selected record.</title>
          <defs><pattern id={`${title}-grid`} width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#263348" strokeWidth="1" /></pattern></defs>
          <rect width="1000" height="700" fill="#0b1321" />
          <rect width="1000" height="700" fill={`url(#${title}-grid)`} />
          <path d={plot.path} fill="none" stroke={site.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {definition.landmarks.map((entry, i) => {
            if (entry.sol === undefined) return null;
            const stop = data.stops[closestStopIndex(data.stops, entry.sol)];
            const [x, y] = plot.project(stop);
            return <g key={entry.name} transform={`translate(${x} ${y})`}><circle r="12" fill="#152035" stroke={site.color} strokeWidth="2" /><text textAnchor="middle" y="5" fill="white" fontSize="13">{i + 1}</text></g>;
          })}
          <circle cx={start[0]} cy={start[1]} r="9" fill="#0b1321" stroke="#f3f7ff" strokeWidth="3" />
          <path d={`M${end[0]} ${end[1] - 10}l10 10-10 10-10-10Z`} fill={site.color} stroke="white" strokeWidth="2" />
          <circle cx={cursor[0]} cy={cursor[1]} r="5" fill="white" stroke="#0b1321" strokeWidth="2" />
          <path d="M940 85V40m-8 12 8-12 8 12" stroke="#c5d2ec" strokeWidth="2" fill="none" /><text x="940" y="30" textAnchor="middle" fill="#c5d2ec" fontSize="16">N</text>
          <path d={`M55 625v9h${plot.scaleMeters * plot.scale}v-9`} stroke="white" strokeWidth="2" fill="none" />
          <text x="55" y="657" fill="#b8c6e0" fontSize="14">{plot.scaleMeters >= 1000 ? `${plot.scaleMeters / 1000} km` : `${plot.scaleMeters} m`}</text>
        </svg>
        <p className={styles.legend}>○ Start of mapped traverse <span style={{ color: site.color }}>◆ {definition.endpointLabel}</span> ● Selected record</p>
        <p className={styles.note}>North-up route diagram, not a terrain photograph. Separate source segments remain separate. A rover route is too small to inspect at whole-planet scale.</p>
        <div className={styles.recordBox}>
          <label>Recorded position <span>{index + 1} / {data.stops.length.toLocaleString("en")}</span>
            <input aria-label="Recorded position" aria-valuetext={`${solRange(current)}, ${detailedCoordinates(current)}`} type="range" min="0" max={data.stops.length - 1} step="1" value={index} onChange={(event) => chooseRecord(Number(event.target.value))} />
          </label>
          <div className={styles.recordButtons}>
            <button type="button" disabled={index === 0} onClick={() => chooseRecord(index - 1)}>Previous</button>
            <label>Record <input aria-label="Record number" type="number" min="1" max={data.stops.length} value={index + 1} onChange={(event) => { if (event.target.value) chooseRecord(Number(event.target.value) - 1); }} /></label>
            <button type="button" disabled={index === data.stops.length - 1} onClick={() => chooseRecord(index + 1)}>Next</button>
          </div>
          <p aria-live="polite"><strong>{solRange(current)}</strong> · {detailedCoordinates(current)}<br /><span>Site {current[4]} · Drive {current[5]}</span></p>
        </div>
      </div>
      <div className={styles.sidebar}>
        <h3>Places visited</h3>
        <p className={styles.note}>Named visits are linked to the nearest published rover record for that sol, not a surveyed center of the landmark.</p>
        <ol className={styles.visits}>{definition.landmarks.map((entry, i) => <li key={entry.name}>
          <button type="button" aria-pressed={landmarkIndex === i} onClick={() => {
            if (entry.sol === undefined) return;
            setRecord(closestStopIndex(data.stops, entry.sol)); setLandmarkIndex(i);
          }}><span>{i + 1}</span><span>{entry.name}<small>Documented visit · Sol {entry.sol}</small></span></button>
        </li>)}</ol>
        {landmark && <div className={styles.landmarkInfo}><strong>{landmark.name}</strong><p>{landmark.description}</p><a href={landmark.source} target="_blank" rel="noopener noreferrer">NASA visit reference</a></div>}
        <Endpoint site={site} />
        <button type="button" className={styles.endpointButton} onClick={() => chooseRecord(data.stops.length - 1)}>Select last published record</button>
        <p className={styles.note}>{definition.coverage}</p>
        <p className={styles.note}>Repeated stationary entries are retained. Records are localizations, not every wheel movement.</p>
        <div className={styles.links}><a href={definition.source} target="_blank" rel="noopener noreferrer">Source map &amp; documentation</a><a href={getRouteSnapshot(site.id)?.file} download>Download all route records</a></div>
      </div>
    </>
  );
}

export function Endpoint({ site }: { site: Site }) {
  const definition = getJourneyDefinition(site.id);
  const snapshot = getRouteSnapshot(site.id);
  return <div className={styles.endpoint}>
    <p className={styles.kicker}>{definition.endpointLabel}</p><strong>{definition.endpointArea}</strong>
    {snapshot && <p>{detailedCoordinates(snapshot.last)}<br />{solRange(snapshot.last)} · snapshot {snapshot.snapshotDate}</p>}
    {definition.contact && <p><strong>{definition.contact.label}</strong><br /><time dateTime={definition.contact.date}>{definition.contact.date}</time> <a href={definition.contact.source} target="_blank" rel="noopener noreferrer">NASA reference</a></p>}
    <p className={styles.note}>{definition.endpointNote}</p>
    <a href={definition.endpointSource} target="_blank" rel="noopener noreferrer">Endpoint evidence</a>
  </div>;
}

export default function MarsJourneyPanel({ site, data, loading, failed, retry }: Props) {
  const definition = getJourneyDefinition(site.id);
  return <section className={styles.panel} aria-label={`${site.rover} journey`}>
    {data ? <RegionalRoute key={site.id} site={site} data={data} /> : <>
      <div className={styles.mapColumn}>
        <div className={styles.mapHeading}><h3>{site.rover} · journey evidence</h3></div>
        {loading && <p role="status">Loading recorded route…</p>}
        {failed && <div role="status"><p>The route snapshot is unavailable. NASA references and endpoint information remain available.</p><button type="button" onClick={retry}>Retry route</button></div>}
        {definition.images?.map((image) => <figure className={styles.figure} key={image.file}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.file} alt={image.alt} loading="lazy" />
          <figcaption>{image.caption} · {image.credit} <a href={image.source} target="_blank" rel="noopener noreferrer">NASA source</a></figcaption>
        </figure>)}
        <p className={styles.note}>{definition.coverage}</p>
      </div>
      <div className={styles.sidebar}><h3>Documented places</h3>
        {definition.landmarks.map((entry) => <div className={styles.landmarkInfo} key={entry.name}><strong>{entry.name}</strong><p>{entry.description}</p><a href={entry.source} target="_blank" rel="noopener noreferrer">NASA reference</a></div>)}
        <Endpoint site={site} />
      </div>
    </>}
  </section>;
}
