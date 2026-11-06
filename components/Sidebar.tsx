"use client";

import Link from "next/link";
import { LogoTile } from "./CosmoLogo";

// Desktop-only sidebar: new chat, recent topics, and the Explorer Level card.

const STARS_PER_LEVEL = 10;

export default function Sidebar({
  stars,
  history,
  onNew,
  onPick,
}: {
  stars: number;
  history: string[];
  onNew: () => void;
  onPick: (q: string) => void;
}) {
  const level = Math.floor(stars / STARS_PER_LEVEL) + 1;
  const into = stars % STARS_PER_LEVEL;
  const toNext = STARS_PER_LEVEL - into;

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <LogoTile size={40} />
        <span className="hero__eyebrow hero__eyebrow--sm">Cosmic Juniors</span>
      </div>
      <button className="btn-purple t-label" onClick={onNew}>
        +&nbsp; New conversation
      </button>
      <Link href="/games" className="games-link t-label">
        Mission games
      </Link>

      <nav className="history" aria-label="Recent adventures">
        {history.length > 0 && <span className="t-caption c-muted">Recent</span>}
        {history.map((h, i) => (
          <button key={h + i} className={`history__item t-label${i === 0 ? " is-active" : ""}`} onClick={() => onPick(h)}>
            {h}
          </button>
        ))}
      </nav>

      <div className="level-card">
        <span className="t-subtitle">Explorer level {level}</span>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={STARS_PER_LEVEL} aria-valuenow={into}>
          <div className="progress__fill" style={{ width: `${(into / STARS_PER_LEVEL) * 100}%` }} />
        </div>
        <span className="t-caption c-muted">
          {stars} stars · {toNext} more to level {level + 1}
        </span>
      </div>
    </aside>
  );
}
