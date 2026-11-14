import type { Metadata } from "next";
import Link from "next/link";
import GameShell from "@/components/games/GameShell";
import Explorer from "@/components/Explorer";

export const metadata: Metadata = {
  title: "Mission Games · Cosmic Juniors",
  description: "Rebuild Sojourner, fly NASA missions to Mars, and try the Mars Landing and Pathfinder simulators.",
  openGraph: { title: "Mission Games · Cosmic Juniors", description: "Rebuild Sojourner, fly NASA missions to Mars, and try the Mars Landing and Pathfinder simulators.", url: "/games", siteName: "Cosmic Juniors", type: "website" },
  twitter: { card: "summary_large_image", title: "Mission Games · Cosmic Juniors", description: "Rebuild Sojourner, fly NASA missions to Mars, and try the Mars Landing and Pathfinder simulators." },
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
    text: "Launch the real rockets from Cape Canaveral, then cruise to Mars through the meteoroids.",
    level: 2,
    levelName: "Medium",
    img: "https://images-assets.nasa.gov/image/PIA04754/PIA04754~small.jpg",
    alt: "The Delta II rocket launching Mars Pathfinder from Cape Canaveral in 1996",
  },
  {
    href: "/games/landing",
    tag: "Mission 03 · Skill",
    title: "Mars Landing",
    text: "Heat shield, parachute, airbags, engines or sky crane: land like the real missions did.",
    level: 3,
    levelName: "Hard",
    img: "https://images-assets.nasa.gov/image/PIA24428/PIA24428~small.jpg",
    alt: "Perseverance being lowered to the surface of Mars by the sky crane, photographed from the descent stage",
  },
  {
    href: "/games/pathfinder-landing",
    tag: "Mission 04 · Simulator",
    title: "Pathfinder Landing",
    text: "Fly from deep space and guide Pathfinder to Ares Vallis with parachute, retrorockets, and airbags.",
    level: 3,
    levelName: "Hard",
    img: "/story/sojourner/landed.jpg",
    alt: "NASA photograph of Sojourner stowed on a Mars Pathfinder lander petal",
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
