"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { formatLandingCoordinates, marsRoverSites, type MarsRoverSite } from "@/lib/landing-sites";
import styles from "./MarsSitePicker.module.css";

type Props = { selected: string; onSelect: (site: MarsRoverSite) => void };

export default function MarsSitePicker({ selected, onSelect }: Props) {
  const wheel = useRef<HTMLDivElement>(null);

  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    const list = wheel.current;
    if (!list) return;
    const centerSelected = () => {
      const row = list.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      if (!row || !list.clientHeight) return;
      window.clearTimeout(timer.current);
      list.scrollTop = row.offsetTop + (row.offsetHeight - list.clientHeight) / 2;
    };
    centerSelected();
    const observer = new ResizeObserver(centerSelected);
    observer.observe(list);
    return () => observer.disconnect();
  }, [selected]);

  return (
    <div className={styles.frame}>
      <div ref={wheel} className={styles.wheel} role="group" aria-label="Choose a rover landing site"
        onScroll={(event) => {
          const list = event.currentTarget;
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => {
            if (!list.clientHeight) return;
            const middle = list.scrollTop + list.clientHeight / 2;
            const index = [...list.querySelectorAll("button")].findIndex((row) =>
              middle >= row.offsetTop && middle < row.offsetTop + row.offsetHeight);
            const site = marsRoverSites[index];
            if (site && site.id !== selected) onSelect(site);
          }, 140);
        }}>
        {marsRoverSites.map((site, index) => (
          <button key={site.id} type="button" className={styles.row} aria-pressed={selected === site.id}
            onClick={() => { window.clearTimeout(timer.current); onSelect(site); }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
              event.preventDefault();
              const next = index + (event.key === "ArrowUp" ? -1 : 1);
              const nextSite = marsRoverSites[next];
              if (!nextSite) return;
              window.clearTimeout(timer.current);
              onSelect(nextSite);
              wheel.current?.querySelectorAll("button")[next]?.focus({ preventScroll: true });
            }}>
            <span className={styles.marker} data-approximate={site.approximate} style={{ color: site.color }} aria-hidden="true" />
            <span className={styles.name}>
              <strong>{site.rover}</strong>
              <small>{site.region} · {site.arrivalDate.slice(0, 4)}</small>
              <small>{formatLandingCoordinates(site, site.approximate)}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
