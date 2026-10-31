"use client";

import { STARTERS } from "@/lib/starters";

// Desktop sidebar (Figma: Desktop · Conversation → Sidebar).

export default function Sidebar({
  recent,
  activeTopic,
  onNew,
  onPick,
}: {
  recent: string[];
  activeTopic: string | null;
  onNew: () => void;
  onPick: (q: string) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="t-display sidebar__wordmark">Cosmic Juniors</span>
        <span className="t-label c-tertiary">Space Apps 2026 · Beirut</span>
      </div>

      <button className="btn-solid t-button" onClick={onNew}>
        New conversation
      </button>

      <nav className="nav" aria-label="Topics">
        <span className="t-label c-tertiary">Topics</span>
        {STARTERS.map((s) => (
          <button
            key={s.label}
            className={`nav__item t-body${activeTopic === s.label ? " is-active" : ""}`}
            onClick={() => onPick(s.question)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {recent.length > 0 && (
        <nav className="nav" aria-label="Recent questions">
          <span className="t-label c-tertiary">Recent</span>
          {recent.map((q, i) => (
            <button key={q + i} className="nav__item t-body" onClick={() => onPick(q)}>
              {q}
            </button>
          ))}
        </nav>
      )}

      <p className="sidebar__foot t-small c-tertiary">
        Cosmo answers with facts from NASA and links every source. Built for the NASA Space Apps Challenge 2026.
      </p>
    </aside>
  );
}
