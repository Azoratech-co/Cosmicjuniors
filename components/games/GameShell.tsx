"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Starfield from "../Starfield";
import SiteHeader from "../site/SiteHeader";
import SiteFooter from "../site/SiteFooter";
import { STARS_EVENT, getStars } from "@/lib/stars";

// Shared frame for the games: back link, title, and the kid's star count.

export { StarCount } from "../site/StarCount";

/** Stop long presses from selecting text or opening the Copy menu while playing (iPhone). */
function useNoSelect() {
  useEffect(() => {
    const inGame = (e: Event) => e.target instanceof Element && !e.target.closest(".win-panel");
    const block = (e: Event) => inGame(e) && e.preventDefault();
    document.addEventListener("selectstart", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("selectstart", block);
      document.removeEventListener("contextmenu", block);
    };
  }, []);
}

export default function GameShell({
  title,
  tagline,
  backHref = "/games",
  backLabel = "All games",
  showPlanet = true,
  children,
}: {
  title: string;
  tagline?: string;
  backHref?: string;
  backLabel?: string;
  showPlanet?: boolean;
  children: React.ReactNode;
}) {
  useNoSelect();
  return (
    <div className="game-page">
      <Starfield />
      {showPlanet && <div className="mars-glow" aria-hidden="true" />}
      <SiteHeader />
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
      <SiteFooter />
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
