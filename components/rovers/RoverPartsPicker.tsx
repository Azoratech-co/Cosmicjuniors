"use client";

import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import type { RoverModel, RoverPart } from "@/lib/rover-models";
import styles from "./RoverViewer.module.css";

type Props = {
  guide: NonNullable<RoverModel["partsGuide"]>;
  selected?: string;
  onSelect: (part: RoverPart) => void;
  /** Called when the selected part is clicked again. */
  onClear: () => void;
  highlight: boolean;
  onHighlight: () => void;
  highlightAvailable: boolean;
};

export default function RoverPartsPicker({ guide, selected, onSelect, onClear, highlight, onHighlight, highlightAvailable }: Props) {
  const { diagram, parts } = guide;
  const heading = useId();
  const wheel = useRef<HTMLDivElement>(null);
  const rows = useRef(new Map<string, HTMLButtonElement>());
  const centered = useRef<string | undefined>(parts[0]?.id);
  const timer = useRef<number>(undefined);

  function center(part: RoverPart) {
    const list = wheel.current;
    const row = rows.current.get(part.id);
    if (!list || !row) return;
    centered.current = part.id;
    list.scrollTop = row.offsetTop - list.clientHeight * 0.56 + row.offsetHeight / 2;
  }

  function select(part: RoverPart) {
    window.clearTimeout(timer.current);
    center(part);
    onSelect(part);
  }

  useEffect(() => {
    if (!selected && parts[0]) {
      window.clearTimeout(timer.current);
      center(parts[0]);
    }
  }, [parts, selected]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function settle() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const list = wheel.current;
      if (!list) return;
      const middle = list.scrollTop + list.clientHeight * 0.56;
      let nearest: RoverPart | undefined;
      let closest = Infinity;
      for (const part of parts) {
        const row = rows.current.get(part.id);
        if (!row) continue;
        const distance = Math.abs(row.offsetTop + row.offsetHeight / 2 - middle);
        if (distance < closest) {
          closest = distance;
          nearest = part;
        }
      }
      if (nearest && nearest.id !== centered.current) select(nearest);
    }, 140);
  }

  // a click on the part that is already selected turns it off
  function toggle(part: RoverPart) {
    if (selected === part.id) onClear();
    else select(part);
  }

  function moveSelection(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const part = parts[index + (event.key === "ArrowUp" ? -1 : 1)];
    if (!part) return;
    select(part);
    rows.current.get(part.id)?.focus({ preventScroll: true });
  }

  return (
    <aside className={styles.parts} aria-labelledby={heading}>
      <h2 id={heading} className={styles.partsTitle}>Rover parts</h2>
      <div className={styles.diagram} style={{ aspectRatio: diagram.width / diagram.height }}>
        <div className={styles.diagramLines} style={{ maskImage: `url(${diagram.image})` }} aria-hidden="true" />
        {parts.map((part, index) => (
          <button
            key={part.id}
            type="button"
            className={styles.diagramNumber}
            aria-label={`${index + 1}. ${part.name}`}
            aria-pressed={selected === part.id}
            onClick={() => toggle(part)}
            style={{ left: `${part.diagram[0] / diagram.width * 100}%`, top: `${part.diagram[1] / diagram.height * 100}%` }}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className={styles.wheelFrame}>
        <div className={styles.wheel} ref={wheel} onScroll={settle} role="group" aria-label="Scroll to choose a rover part">
          {parts.map((part, index) => (
            <button
              key={part.id}
              type="button"
              ref={(element) => {
                if (element) rows.current.set(part.id, element);
                else rows.current.delete(part.id);
              }}
              className={styles.wheelRow}
              aria-pressed={selected === part.id}
              onClick={() => toggle(part)}
              onKeyDown={(event) => moveSelection(event, index)}
            >
              {part.name}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className={styles.highlight} aria-pressed={highlight} onClick={onHighlight} disabled={!highlightAvailable}>
        Highlight part
      </button>
    </aside>
  );
}
