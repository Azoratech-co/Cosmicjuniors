"use client";

import { useEffect, useState } from "react";
import { STARS_EVENT } from "@/lib/stars";
import { STARS_PER_LEVEL, getProgress } from "@/lib/progress";

// Explorer profile: level, progress to the next level, stars and achievement badges.
// Kept small so it never competes with Ask Cosmo.

function useProgress() {
  const [p, setP] = useState<ReturnType<typeof getProgress> | null>(null);
  useEffect(() => {
    const sync = () => setP(getProgress());
    sync();
    window.addEventListener(STARS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STARS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return p;
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  first: <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V15h.5" />,
  puzzle: <path d="M9 4h3v2.2a1.8 1.8 0 1 0 3 0V4h3v5h-2.2a1.8 1.8 0 1 0 0 3H18v6H6v-6h2.2a1.8 1.8 0 1 0 0-3H6V4z" />,
  mars: <><circle cx="12" cy="12" r="7" /><path d="M7 10.5c2 .8 4 .6 6-.6M9 15c1.5-.8 3.5-.7 6 .3" /></>,
  facts: <path d="M12 3l7 4v10l-7 4-7-4V7zM12 11v10M5 7l7 4 7-4" />,
  landing: <><path d="M6 9a6 6 0 0 1 12 0z" /><path d="M7 9l5 7 5-7M12 16v3M8 21h8" /></>,
  stars: <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />,
};

export function BadgeIcon({ id }: { id: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {BADGE_ICONS[id]}
    </svg>
  );
}

export default function Explorer({ variant = "card" }: { variant?: "card" | "strip" }) {
  const p = useProgress();
  if (!p) return <div className={`explorer explorer--${variant}`} aria-hidden="true" />;
  const earned = p.badges.filter((b) => b.earned).length;
  return (
    <section className={`explorer explorer--${variant}`} aria-label="Explorer profile">
      <div className="explorer__top">
        <span className="explorer__level" aria-hidden="true">{p.level}</span>
        <div className="explorer__who">
          <span className="explorer__title">Explorer level {p.level}</span>
          <span className="explorer__sub">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" />
            </svg>
            {p.stars} stars · {p.toNext} to level {p.level + 1}
          </span>
        </div>
      </div>
      <div
        className="explorer__bar"
        role="progressbar"
        aria-label={`Progress to level ${p.level + 1}`}
        aria-valuemin={0}
        aria-valuemax={STARS_PER_LEVEL}
        aria-valuenow={p.into}
      >
        <span style={{ width: `${(p.into / STARS_PER_LEVEL) * 100}%` }} />
      </div>
      <div className="explorer__badges" aria-label={`${earned} of ${p.badges.length} badges earned`}>
        {p.badges.map((b) => (
          <span
            key={b.id}
            className={`badge${b.earned ? " is-earned" : ""}`}
            title={`${b.name}${b.earned ? "" : `: ${b.hint}`}`}
            aria-label={`${b.name}, ${b.earned ? "earned" : `locked. ${b.hint}`}`}
            role="img"
          >
            <BadgeIcon id={b.id} />
          </span>
        ))}
      </div>
    </section>
  );
}
