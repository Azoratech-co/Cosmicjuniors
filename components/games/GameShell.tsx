"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Starfield from "../Starfield";
import { LogoTile } from "../CosmoLogo";
import { STARS_EVENT, getStars } from "@/lib/stars";

// Shared frame for the games: back link, title, and the kid's star count.

export function StarCount() {
  const [stars, setStars] = useState(0);
  useEffect(() => {
    const sync = () => setStars(getStars());
    sync();
    window.addEventListener(STARS_EVENT, sync);
    return () => window.removeEventListener(STARS_EVENT, sync);
  }, []);
  return (
    <span className="stars-badge t-label" aria-label={`${stars} stars collected`}>
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" />
      </svg>
      {stars}
    </span>
  );
}

export default function GameShell({
  title,
  tagline,
  backHref = "/games",
  backLabel = "All games",
  children,
}: {
  title: string;
  tagline: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="game-page">
      <Starfield />
      <div className="mars-glow" aria-hidden="true" />
      <header className="game-top">
        <Link href={backHref} className="game-back t-label">
          ← {backLabel}
        </Link>
        <Link href="/" className="game-brand" aria-label="Cosmic Juniors home">
          <LogoTile size={32} />
          <span className="hero__eyebrow hero__eyebrow--sm">Cosmic Juniors</span>
        </Link>
        <StarCount />
      </header>
      <div className="game-head">
        <h1 className="t-display">{title}</h1>
        <p className="t-body c-muted">{tagline}</p>
      </div>
      <main className="game-main">{children}</main>
    </div>
  );
}

/** Win screen with NASA facts and a source link, shared by all games. */
export function WinPanel({
  title,
  stars,
  facts,
  sourceTitle,
  sourceUrl,
  onAgain,
  children,
}: {
  title: string;
  stars: number;
  facts: string[];
  sourceTitle: string;
  sourceUrl: string;
  onAgain: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="win-panel" role="dialog" aria-label={title}>
      <span className="t-caption c-star">Mission complete · +{stars} stars</span>
      <h2 className="t-title">{title}</h2>
      {children}
      <ul className="win-facts t-body-sm">
        {facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <div className="win-actions">
        <button className="btn-purple t-label" onClick={onAgain}>
          Play again
        </button>
        <a className="btn-ghost t-label" href={sourceUrl} target="_blank" rel="noopener noreferrer">
          {sourceTitle} on NASA.gov
        </a>
      </div>
    </div>
  );
}
