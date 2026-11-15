"use client";

import { useId, useMemo, useState } from "react";
import { closestStopIndex, detailedCoordinates, getJourneyDefinition, getRouteSnapshot, regionalPoint, solRange, type JourneyData, type JourneyLandmark, type SurfacePoint } from "@/lib/mars-journeys";
import type { LandingSiteDetails as Site } from "@/lib/landing-sites";
import MarsJourneyEndpoint from "./MarsJourneyEndpoint";
import MarsInfo from "./MarsInfo";
import infoStyles from "./LandingGlobe.module.css";
import styles from "./MarsJourneyPanel.module.css";

type Props = { site: Site; data?: JourneyData; loading: boolean; failed: boolean; retry: () => void };

function LandmarkInfo({ landmark, reveal }: { landmark: JourneyLandmark; reveal?: boolean }) {
  return (
    <section className={infoStyles.infoCard} aria-label={landmark.name}>
      <MarsInfo
        reveal={reveal}
        label="Documented visit"
        title={landmark.name}
        fields={landmark.sol === undefined ? undefined : [["Mission sol", landmark.sol]]}
        more={{ content: landmark.description }}
        sources={<a href={landmark.source} target="_blank" rel="noopener noreferrer">NASA visit reference</a>}
      />
    </section>
  );
}

// Mars Trek's CTX tile grid has a (-180°, 90°) origin and 2 × 1 tiles at level 0.
function terrainTiles(origin: SurfacePoint, project: (point: SurfacePoint) => number[]) {
  const [originX, originY] = project(origin);
  const [eastX, northY] = project([origin[0] + 1, origin[1] + 1]);
  const pixelsPerLongitude = eastX - originX;
  const pixelsPerLatitude = originY - northY;
  const west = origin[0] - originX / pixelsPerLongitude;
  const east = west + 1000 / pixelsPerLongitude;
  const north = origin[1] + originY / pixelsPerLatitude;
  const south = north - 700 / pixelsPerLatitude;
  const degreesPerPixel = Math.max(1 / pixelsPerLongitude, 1 / pixelsPerLatitude);
  const level = Math.max(0, Math.min(11, Math.floor(Math.log2(180 / (512 * degreesPerPixel)))));
  const tileDegrees = 180 / 2 ** level;
  const columnCount = 2 ** (level + 1);
  const tiles = [];

  for (let row = Math.max(0, Math.floor((90 - north) / tileDegrees)); row < Math.min(2 ** level, Math.ceil((90 - south) / tileDegrees)); row++) {
    for (let col = Math.floor((west + 180) / tileDegrees); col < Math.ceil((east + 180) / tileDegrees); col++) {
      const column = ((col % columnCount) + columnCount) % columnCount;
      tiles.push({
        href: `https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/${level}/${row}/${column}`,
        x: (col * tileDegrees - 180 - west) * pixelsPerLongitude,
        y: (north - (90 - row * tileDegrees)) * pixelsPerLatitude,
        width: tileDegrees * pixelsPerLongitude,
        height: tileDegrees * pixelsPerLatitude,
      });
    }
  }
  return tiles;
}

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
    return { project, path, scale, scaleMeters, tiles: terrainTiles(origin, project) };
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
          <title id={title}>{site.rover} regional traverse, north up. Ring: first mapped position. Diamond: last published position. Gold crosshair: selected record.</title>
          <rect width="1000" height="700" fill="#0b1321" />
          <g aria-hidden="true">
            {plot.tiles.map((tile) => <image key={tile.href} {...tile} preserveAspectRatio="none" />)}
            <rect width="1000" height="700" fill="#0b1321" fillOpacity=".22" />
          </g>
          <g fill="none" strokeLinejoin="round" strokeLinecap="round">
            <path d={plot.path} stroke="#0b1321" strokeWidth="6" />
            <path d={plot.path} stroke={site.color} strokeWidth="3" />
          </g>
          {definition.landmarks.map((entry, i) => {
            if (entry.sol === undefined) return null;
            const stop = data.stops[closestStopIndex(data.stops, entry.sol)];
            const [x, y] = plot.project(stop);
            return <g key={entry.name} transform={`translate(${x} ${y})`}><circle r="12" fill="#152035" stroke={site.color} strokeWidth="2" /><text textAnchor="middle" y="5" fill="white" fontSize="13">{i + 1}</text></g>;
          })}
          <circle cx={start[0]} cy={start[1]} r="9" fill="#0b1321" stroke="#f3f7ff" strokeWidth="3" />
          <path d={`M${end[0]} ${end[1] - 10}l10 10-10 10-10-10Z`} fill={site.color} stroke="white" strokeWidth="2" />
          <g transform={`translate(${cursor[0]} ${cursor[1]})`} aria-hidden="true">
            <circle r="20" fill="#0b1321" fillOpacity=".8" />
            <circle r="17" fill="none" stroke="#ffdb79" strokeWidth="3" />
            <path d="M-25 0h12m26 0h12M0-25v12m0 26v12" stroke="#ffdb79" strokeWidth="3" />
            <circle r="5" fill="#ffdb79" stroke="#0b1321" strokeWidth="2" />
          </g>
          <g className={styles.mapGuides}>
            <path d="M940 85V40m-8 12 8-12 8 12" stroke="white" strokeWidth="2" fill="none" />
            <text x="940" y="30" textAnchor="middle" fontSize="16">N</text>
            <path d={`M55 625v9h${plot.scaleMeters * plot.scale}v-9`} stroke="white" strokeWidth="2" fill="none" />
            <text x="55" y="657" fontSize="14">{plot.scaleMeters >= 1000 ? `${plot.scaleMeters / 1000} km` : `${plot.scaleMeters} m`}</text>
          </g>
        </svg>
        <p className={styles.legend}>○ Start of mapped traverse <span style={{ color: site.color }}>◆ {definition.endpointLabel}</span> <span className={styles.cursorKey}>&#8853; Selected record</span></p>
        <p className={styles.note}>Orbital imagery: NASA/JPL-Caltech/MSSS/Murray Lab · <a href="https://murray-lab.caltech.edu/CTX/" target="_blank" rel="noopener noreferrer">Global CTX Mosaic</a>
          {site.id === "opportunity" && <> · <a href={definition.endpointSource} target="_blank" rel="noopener noreferrer">NASA final traverse map</a></>}
        </p>
        <section className={infoStyles.infoCard} aria-label="Recorded position">
          <div aria-live="polite">
            <MarsInfo
              title="Recorded position"
              fields={[
                ["Record", `${(index + 1).toLocaleString("en")} / ${data.stops.length.toLocaleString("en")}`],
                ["Coordinates", detailedCoordinates(current)],
                ["Coverage", solRange(current)],
              ]}
              more={{ content: <><strong>Site:</strong> {current[4]} · <strong>Drive:</strong> {current[5]}</> }}
            />
          </div>
          <div className={styles.recordControls}>
            <input aria-label="Recorded position" aria-valuetext={`${solRange(current)}, ${detailedCoordinates(current)}`} type="range" min="0" max={data.stops.length - 1} step="1" value={index} onChange={(event) => chooseRecord(Number(event.target.value))} />
            <div className={styles.recordButtons}>
              <button type="button" disabled={index === 0} onClick={() => chooseRecord(index - 1)}>Previous</button>
              <label>Record <input aria-label="Record number" type="number" min="1" max={data.stops.length} value={index + 1} onChange={(event) => { if (event.target.value) chooseRecord(Number(event.target.value) - 1); }} /></label>
              <button type="button" disabled={index === data.stops.length - 1} onClick={() => chooseRecord(index + 1)}>Next</button>
            </div>
          </div>
        </section>
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
        {landmark && <LandmarkInfo key={landmark.name} landmark={landmark} reveal />}
        <MarsJourneyEndpoint site={site} reveal />
        <button type="button" className={styles.endpointButton} onClick={() => chooseRecord(data.stops.length - 1)}>Select last published record</button>
        <p className={styles.note}>{definition.coverage}</p>
        <p className={styles.note}>Repeated stationary entries are retained. Records are localizations, not every wheel movement.</p>
        <div className={styles.links}><a href={definition.source} target="_blank" rel="noopener noreferrer">Source map &amp; documentation</a><a href={getRouteSnapshot(site.id)?.file} download>Download all route records</a></div>
      </div>
    </>
  );
}

export default function MarsJourneyPanel({ site, data, loading, failed, retry }: Props) {
  const definition = getJourneyDefinition(site.id);
  return <section className={styles.panel} aria-label={`${site.rover} journey`}>
    {data ? <RegionalRoute key={site.id} site={site} data={data} /> : <>
      <div className={styles.mapColumn}>
        <div className={styles.mapHeading}><h3>{site.rover} · journey evidence</h3></div>
        {site.id === "zhurong" && <p className={styles.note}>HiRISE photographs show Zhurong&apos;s wheel tracks. The available sources lack the waypoint data needed for an interactive route map.</p>}
        {loading && <p role="status">Loading recorded route…</p>}
        {failed && <div role="status"><p>The route snapshot is unavailable. NASA references and endpoint information remain available.</p><button type="button" onClick={retry}>Retry route</button></div>}
        {definition.images?.map((image) => <figure className={styles.figure} key={image.file}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.file} alt={image.alt} loading="lazy" />
          <figcaption className={infoStyles.infoCard}>
            <MarsInfo title={image.title} fields={[["Image credit", image.credit]]}
              more={{ content: image.caption }}
              sources={<a href={image.source} target="_blank" rel="noopener noreferrer">Image source</a>} />
          </figcaption>
        </figure>)}
        <p className={styles.note}>{definition.coverage}</p>
      </div>
      <div className={styles.sidebar}><h3>Documented places</h3>
        {definition.landmarks.map((entry) => <LandmarkInfo key={entry.name} landmark={entry} />)}
        <MarsJourneyEndpoint site={site} reveal />
      </div>
    </>}
  </section>;
}
