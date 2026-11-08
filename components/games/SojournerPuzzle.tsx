"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WinPanel } from "./GameShell";
import { addStars } from "@/lib/stars";

// Sojourner Puzzle: a real NASA photo is cut into pieces that sit mixed up in a tray.
// Drag a piece onto the picture (or tap a piece, then tap its spot). Pieces only snap
// into their correct place, so younger kids can't get stuck with a wrong layout.

const PHOTO = {
  src: "https://images-assets.nasa.gov/image/PIA01551/PIA01551~orig.jpg",
  width: 1099,
  height: 572,
  credit: "NASA/JPL · PIA01551",
};

const LEVELS = [
  { name: "Easy", cols: 3, rows: 2, stars: 3 },
  { name: "Normal", cols: 4, rows: 3, stars: 5 },
  { name: "Hard", cols: 6, rows: 4, stars: 8 },
];

const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

interface Drag {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
}

export default function SojournerPuzzle() {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];
  const total = level.cols * level.rows;

  const [tray, setTray] = useState<number[]>([]);
  const [placed, setPlaced] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [finishedIn, setFinishedIn] = useState<number | null>(null);
  const [hint, setHint] = useState(true);
  const [boardW, setBoardW] = useState(560);

  const boardRef = useRef<HTMLDivElement>(null);
  const boardColRef = useRef<HTMLDivElement>(null);

  const boardH = (boardW * PHOTO.height) / PHOTO.width;
  const cellW = boardW / level.cols;
  const cellH = boardH / level.rows;
  const done = finishedIn !== null;

  const reset = useCallback((idx: number) => {
    const n = LEVELS[idx].cols * LEVELS[idx].rows;
    setLevelIdx(idx);
    setTray(shuffle(Array.from({ length: n }, (_, i) => i)));
    setPlaced(Array(n).fill(false));
    setSelected(null);
    setDrag(null);
    setMoves(0);
    setStartedAt(null);
    setFinishedIn(null);
  }, []);

  useEffect(() => reset(0), [reset]);

  // Fit the picture to its column.
  useEffect(() => {
    const el = boardColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoardW(Math.min(720, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Timer
  useEffect(() => {
    if (!startedAt || done) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [startedAt, done]);

  const start = () => {
    if (!startedAt) {
      setStartedAt(Date.now());
      setNow(Date.now());
    }
  };

  const place = (id: number, cell: number) => {
    start();
    setMoves((m) => m + 1);
    if (id !== cell) {
      setWrongCell(cell);
      window.setTimeout(() => setWrongCell(null), 450);
      return;
    }
    const nextPlaced = [...placed];
    nextPlaced[id] = true;
    setPlaced(nextPlaced);
    setTray((t) => t.filter((x) => x !== id));
    setSelected(null);
    if (nextPlaced.every(Boolean)) {
      setFinishedIn(Math.round((Date.now() - (startedAt ?? Date.now())) / 1000));
      addStars(level.stars);
      try {
        const prev = JSON.parse(localStorage.getItem("cj-puzzle") || "{}");
        localStorage.setItem("cj-puzzle", JSON.stringify({ solved: (prev.solved ?? 0) + 1 }));
      } catch {}
    }
  };

  const cellAt = (x: number, y: number) => {
    const r = boardRef.current?.getBoundingClientRect();
    if (!r || x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    const c = Math.min(level.cols - 1, Math.floor((x - r.left) / cellW));
    const row = Math.min(level.rows - 1, Math.floor((y - r.top) / cellH));
    return row * level.cols + c;
  };

  // Dragging uses window listeners so the piece follows the finger anywhere on screen.
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;
  useEffect(() => {
    if (!drag) return;
    // While dragging, stop the browser from selecting text or images anywhere on the page.
    document.body.classList.add("is-dragging");
    window.getSelection()?.removeAllRanges();
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const moved = d.moved || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 6;
      setDrag({ ...d, x: e.clientX, y: e.clientY, moved });
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!d) return;
      // A cancelled touch (the browser took over) is neither a tap nor a drop.
      if (e.type === "pointercancel") return;
      if (!d.moved) {
        setSelected((s) => (s === d.id ? null : d.id));
        return;
      }
      const cell = cellAt(e.clientX, e.clientY);
      if (cell !== null) place(d.id, cell);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.body.classList.remove("is-dragging");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id]);

  /** Background slice of the photo for piece `id`, drawn at `scale` of its board size. */
  const slice = (id: number, scale = 1): React.CSSProperties => {
    const c = id % level.cols;
    const r = Math.floor(id / level.cols);
    return {
      width: cellW * scale,
      height: cellH * scale,
      backgroundImage: `url(${PHOTO.src})`,
      backgroundSize: `${boardW * scale}px ${boardH * scale}px`,
      backgroundPosition: `${-c * cellW * scale}px ${-r * cellH * scale}px`,
    };
  };

  const trayScale = Math.min(1, 132 / cellW);
  const elapsed = done ? finishedIn! : startedAt ? Math.round((now - startedAt) / 1000) : 0;
  const placedCount = useMemo(() => placed.filter(Boolean).length, [placed]);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="puzzle">
      <div className="game-toolbar">
        <div className="segmented" role="group" aria-label="Difficulty">
          {LEVELS.map((l, i) => (
            <button key={l.name} className={i === levelIdx ? "is-on" : ""} onClick={() => reset(i)}>
              {l.name} · {l.cols * l.rows}
            </button>
          ))}
        </div>
        <span className="t-label c-muted stat">
          {placedCount}/{total} pieces · {moves} moves · {fmt(elapsed)}
        </span>
        <label className="toggle t-label">
          <input type="checkbox" checked={hint} onChange={(e) => setHint(e.target.checked)} /> Show guide
        </label>
      </div>

      <div className="puzzle-layout">
        <div className="puzzle-board-col" ref={boardColRef}>
          <div
            className={`puzzle-board${hint ? " has-hint" : ""}`}
            ref={boardRef}
            style={{ width: boardW, height: boardH, ["--photo" as string]: `url(${PHOTO.src})` }}
          >
            {Array.from({ length: total }, (_, cell) => {
              const c = cell % level.cols;
              const r = Math.floor(cell / level.cols);
              return (
                <button
                  key={cell}
                  className={`puzzle-cell${placed[cell] ? " is-placed" : ""}${wrongCell === cell ? " is-wrong" : ""}${
                    selected !== null && !placed[cell] ? " is-target" : ""
                  }`}
                  style={{ left: c * cellW, top: r * cellH, width: cellW, height: cellH }}
                  onClick={() => selected !== null && !placed[cell] && place(selected, cell)}
                  aria-label={placed[cell] ? `Piece ${cell + 1} placed` : `Empty spot, row ${r + 1}, column ${c + 1}`}
                  disabled={placed[cell] || done}
                >
                  {placed[cell] && <span className="puzzle-piece" style={slice(cell)} />}
                </button>
              );
            })}
          </div>
          <p className="t-caption c-muted credit">Photo: {PHOTO.credit}</p>
        </div>

        <div className="puzzle-tray" aria-label="Puzzle pieces" hidden={done}>
          {tray.map((id) => (
            <button
              key={id}
              className={`puzzle-piece tray-piece${selected === id ? " is-selected" : ""}${drag?.id === id && drag.moved ? " is-lifted" : ""}`}
              style={slice(id, trayScale)}
              onPointerDown={(e) => {
                e.preventDefault();
                start();
                setDrag({ id, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected((s) => (s === id ? null : id));
                }
              }}
              aria-label={`Puzzle piece${selected === id ? ", selected" : ""}`}
            />
          ))}
          {tray.length === 0 && !done && <span className="t-body-sm c-muted">All pieces placed!</span>}
        </div>
      </div>

      {drag?.moved && (
        <span
          className="puzzle-piece drag-ghost"
          style={{ ...slice(drag.id), left: drag.x - cellW / 2, top: drag.y - cellH / 2 }}
          aria-hidden="true"
        />
      )}

      {done && (
        <WinPanel
          title="You rebuilt Sojourner!"
          stars={level.stars}
          sourceTitle="Mars Pathfinder"
          sourceUrl="https://science.nasa.gov/mission/mars-pathfinder/"
          onAgain={() => reset(levelIdx)}
          againLabel={`Replay ${level.name}`}
          onNext={levelIdx < LEVELS.length - 1 ? () => reset(levelIdx + 1) : undefined}
          nextLabel={
            levelIdx < LEVELS.length - 1
              ? `Next level: ${LEVELS[levelIdx + 1].name} · ${LEVELS[levelIdx + 1].cols * LEVELS[levelIdx + 1].rows} pieces`
              : undefined
          }
          facts={[
            "This real photo shows Sojourner just after it rolled off the Pathfinder lander onto Mars.",
            "Pathfinder landed on July 4, 1997, in an ancient flood plain called Ares Vallis.",
            "Sojourner weighed 10.6 kg and stood about 30 cm tall. It was the first rover to drive on another planet.",
            "It was named after Sojourner Truth, the American civil-rights crusader.",
          ]}
        >
          <p className="t-body-sm c-muted">
            {level.name} · {total} pieces in {fmt(finishedIn!)} with {moves} moves.
            {levelIdx === LEVELS.length - 1 ? " You beat the hardest level!" : ""}
          </p>
        </WinPanel>
      )}
    </div>
  );
}
