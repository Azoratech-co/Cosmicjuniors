"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Starfield from "../Starfield";
import CosmoLogo, { LogoTile } from "../CosmoLogo";
import NavTabs from "../NavTabs";
import ThemePicker from "../ThemePicker";
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
  tagline?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="game-page">
      <Starfield />
      <div className="mars-glow" aria-hidden="true" />
      <header className="chat-header site-header">
        <Link href="/" className="site-header__brand" aria-label="Ask Cosmo home">
          <LogoTile size={36} />
          <CosmoLogo size={17} className="site-header__word" />
        </Link>
        <NavTabs />
        <StarCount />
      </header>
      <div className="game-head">
        {backHref !== "/" && (
          <Link href={backHref} className="game-back t-label">
            ← {backLabel}
          </Link>
        )}
        <h1 className="t-display">{title}</h1>
        {tagline && <p className="t-body c-muted">{tagline}</p>}
      </div>
      <main className="game-main">{children}</main>
      <footer className="site-footer">
        <span>Cosmic Juniors · NASA Space Apps Challenge 2026, Beirut</span>
        <span>Photos and facts: NASA</span>
        <ThemePicker />
      </footer>
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
  againLabel = "Play again",
  onNext,
  nextLabel = "Next mission",
  children,
}: {
  title: string;
  stars: number;
  facts: string[];
  sourceTitle: string;
  sourceUrl: string;
  onAgain: () => void;
  againLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Bring the results into view, since they open below the game.
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);
  return (
    <div className="win-panel" role="dialog" aria-label={title} ref={ref}>
      <span className="t-caption c-star">Mission complete · +{stars} stars</span>
      <h2 className="t-title">{title}</h2>
      {children}
      <ul className="win-facts t-body-sm">
        {facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <div className="win-actions">
        {onNext && (
          <button className="btn-purple t-label" onClick={onNext}>
            {nextLabel} →
          </button>
        )}
        <button className={`${onNext ? "btn-ghost" : "btn-purple"} t-label`} onClick={onAgain}>
          {againLabel}
        </button>
        <a className="btn-ghost t-label" href={sourceUrl} target="_blank" rel="noopener noreferrer">
          {sourceTitle} on NASA.gov
        </a>
      </div>
    </div>
  );
}
