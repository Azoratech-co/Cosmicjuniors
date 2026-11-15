"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import styles from "./RoverViewer.module.css";

type Item = { id: string; name: string };

type Props<T extends Item> = {
  items: readonly T[];
  selected?: string;
  label: string;
  onSelect: (item: T) => void;
  onClear?: () => void;
  fixedRows?: boolean;
};

const selectionLine = 0.56;

export default function ScrollPicker<T extends Item>({ items, selected, label, onSelect, onClear, fixedRows = false }: Props<T>) {
  const wheel = useRef<HTMLDivElement>(null);
  const rows = useRef(new Map<string, HTMLButtonElement>());
  const timer = useRef<number>(undefined);
  const lastWheelStep = useRef(-Infinity);
  const centered = selected ?? items[0]?.id;
  const selectedIndex = items.findIndex(({ id }) => id === centered);

  useLayoutEffect(() => {
    if (fixedRows) return;
    const list = wheel.current;
    const row = centered === undefined ? undefined : rows.current.get(centered);
    if (!list || !row) return;
    const recenter = () => {
      window.clearTimeout(timer.current);
      list.scrollTop = row.offsetTop + row.offsetHeight / 2 - list.clientHeight * selectionLine;
    };
    recenter();
    const observer = new ResizeObserver(recenter);
    observer.observe(list);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer.current);
    };
  }, [centered, fixedRows]);

  useEffect(() => {
    const list = wheel.current;
    if (!fixedRows || !list) return;
    function moveHighlight(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const next = items[selectedIndex + Math.sign(event.deltaY)];
      if (!next) return;
      event.preventDefault();
      if (event.timeStamp - lastWheelStep.current < 160) return;
      lastWheelStep.current = event.timeStamp;
      onSelect(next);
    }
    list.addEventListener("wheel", moveHighlight, { passive: false });
    return () => list.removeEventListener("wheel", moveHighlight);
  }, [fixedRows, items, onSelect, selectedIndex]);

  function select(item: T) {
    window.clearTimeout(timer.current);
    onSelect(item);
  }

  function settle() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const list = wheel.current;
      if (!list?.clientHeight) return;
      const middle = list.scrollTop + list.clientHeight * selectionLine;
      const nearest = items.find(({ id }) => {
        const row = rows.current.get(id);
        return row && middle >= row.offsetTop && middle < row.offsetTop + row.offsetHeight;
      });
      if (nearest && nearest.id !== centered) select(nearest);
    }, 140);
  }

  return (
    <div className={styles.wheelFrame} data-fixed-rows={fixedRows}
      style={fixedRows ? { "--picker-index": selectedIndex } as CSSProperties : undefined}>
      <div className={styles.wheel} ref={wheel} onScroll={fixedRows ? undefined : settle} role="group" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            ref={(element) => {
              if (element) rows.current.set(item.id, element);
              else rows.current.delete(item.id);
            }}
            className={styles.wheelRow}
            aria-pressed={selected === item.id}
            onClick={() => {
              if (selected !== item.id) select(item);
              else if (onClear) {
                window.clearTimeout(timer.current);
                onClear();
              }
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
              event.preventDefault();
              const next = items[index + (event.key === "ArrowUp" ? -1 : 1)];
              if (!next) return;
              select(next);
              rows.current.get(next.id)?.focus({ preventScroll: true });
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
