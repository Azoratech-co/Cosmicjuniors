"use client";

import { LogoTile } from "./CosmoLogo";
import Explorer from "./Explorer";
import ThemePicker from "./ThemePicker";

// Desktop-only sidebar: new chat, recent topics, and the Explorer Level card.


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

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <LogoTile size={40} />
        <span className="hero__eyebrow hero__eyebrow--sm">Cosmic Juniors</span>
      </div>
      <button className="btn-purple t-label" onClick={onNew}>
        +&nbsp; New conversation
      </button>

      <nav className="history" aria-label="Recent adventures">
        {history.length > 0 && <span className="t-caption c-muted">Recent</span>}
        {history.map((h, i) => (
          <button key={h + i} className={`history__item t-label${i === 0 ? " is-active" : ""}`} onClick={() => onPick(h)}>
            {h}
          </button>
        ))}
      </nav>

      <Explorer />
      <p className="sidebar__foot">NASA Space Apps 2026 · Photos: NASA</p>
      <ThemePicker />
    </aside>
  );
}
