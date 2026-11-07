import type { Metadata } from "next";
import Link from "next/link";
import GameShell from "@/components/games/GameShell";
import Explorer from "@/components/Explorer";

export const metadata: Metadata = {
  title: "Mission Games · Cosmic Juniors",
  description: "Three Mars mission games: rebuild Sojourner, fly real NASA cruises to Mars, and land at five real landing sites.",
  openGraph: { title: "Mission Games · Cosmic Juniors", description: "Three Mars mission games: rebuild Sojourner, fly real NASA cruises to Mars, and land at five real landing sites.", url: "/games", siteName: "Cosmic Juniors", type: "website" },
  twitter: { card: "summary_large_image", title: "Mission Games · Cosmic Juniors", description: "Three Mars mission games: rebuild Sojourner, fly real NASA cruises to Mars, and land at five real landing sites." },
};

const GAMES = [
  {
    href: "/games/puzzle",
    tag: "Mission 01 · Puzzle",
    title: "Sojourner Puzzle",
    text: "Rebuild a real photo of the first Mars rover.",
    level: 1,
    levelName: "Easy",
    img: "https://images-assets.nasa.gov/image/PIA01551/PIA01551~orig.jpg",
    alt: "Sojourner rover on Mars",
  },
  {
    href: "/games/dodge",
    tag: "Mission 02 · Arcade",
    title: "Journey to Mars",
    text: "Fly three real NASA cruises and dodge the lasers.",
    level: 2,
    levelName: "Medium",
    img: "https://images-assets.nasa.gov/image/PIA00407/PIA00407~small.jpg",
    alt: "Mars seen from space",
  },
  {
    href: "/games/landing",
    tag: "Mission 03 · Skill",
    title: "Mars Landing",
    text: "Land at five real NASA sites, then do the science.",
    level: 3,
    levelName: "Hard",
    img: "https://images-assets.nasa.gov/image/PIA04318/PIA04318~orig.jpg",
    alt: "Sojourner near rocks on the Martian surface",
  },
];

export default function GamesPage() {
  return (
    <GameShell title="Mission games" backHref="/" backLabel="Ask Cosmo">
      <Explorer variant="strip" />
      <div className="games-grid">
        {GAMES.map((g) => (
          <Link key={g.href} href={g.href} className="game-card">
            <span className="game-card__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.img} alt={g.alt} draggable={false} />
              <span className="game-card__tag">{g.tag}</span>
            </span>
            <span className="game-card__body">
              <span className="game-card__title">{g.title}</span>
              <span className="game-card__text">{g.text}</span>
              <span className="game-card__foot">
                <span className="difficulty" aria-label={`Difficulty: ${g.levelName}`}>
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={`difficulty__dot${n <= g.level ? " is-on" : ""}`} aria-hidden="true" />
                  ))}
                  <span className="difficulty__name">{g.levelName}</span>
                </span>
                <span className="game-card__play">
                  Play
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" fill="currentColor" />
                  </svg>
                </span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </GameShell>
  );
}
