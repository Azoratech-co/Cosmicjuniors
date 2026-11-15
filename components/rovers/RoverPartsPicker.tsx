"use client";

import { useId } from "react";
import type { RoverModel, RoverPart } from "@/lib/rover-models";
import ScrollPicker from "./ScrollPicker";
import styles from "./RoverViewer.module.css";

type Props = {
  guide: NonNullable<RoverModel["partsGuide"]>;
  kind: "rover" | "lander";
  selected?: string;
  onSelect: (part: RoverPart) => void;
  /** Called when the selected part is clicked again. */
  onClear: () => void;
  highlight: boolean;
  onHighlight: () => void;
  highlightAvailable: boolean;
};

export default function RoverPartsPicker({ guide, kind, selected, onSelect, onClear, highlight, onHighlight, highlightAvailable }: Props) {
  const { diagram, parts } = guide;
  const heading = useId();
  // a click on the part that is already selected turns it off
  function toggle(part: RoverPart) {
    if (selected === part.id) onClear();
    else onSelect(part);
  }

  return (
    <aside className={styles.parts} aria-labelledby={heading}>
      <h2 id={heading} className={styles.partsTitle}>{kind === "lander" ? "Lander parts" : "Rover parts"}</h2>
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
      <ScrollPicker items={parts} selected={selected} label={`Scroll to choose a ${kind} part`} onSelect={onSelect} onClear={onClear} />
      <button type="button" className={styles.highlight} aria-pressed={highlight} onClick={onHighlight} disabled={!highlightAvailable}>
        Highlight part
      </button>
    </aside>
  );
}
