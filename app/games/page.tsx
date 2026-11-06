import type { Metadata } from "next";
import Link from "next/link";
import GameShell from "@/components/games/GameShell";

export const metadata: Metadata = {
  title: "Mission Games · Cosmic Juniors",
  description: "Three Mars mission games: rebuild Sojourner, fly real NASA cruises to Mars, and land at five real landing sites.",
  openGraph: { title: "Mission Games · Cosmic Juniors", description: "Three Mars mission games: rebuild Sojourner, fly real NASA cruises to Mars, and land at five real landing sites.", url: "/games", siteName: "Cosmic Juniors", type: "website" },
  twitter: { card: "summary_large_image", title: "Mission Games · Cosmic Juniors", description: "Three Mars mission games: rebuild Sojourner, fly real NASA cruises to Mars, and land at five real landing sites." },
};

const GAMES = [
  {
    href: "/games/puzzle",
    title: "Sojourner Puzzle",
    text: "Rebuild a real photo of the first Mars rover.",
    img: "https://images-assets.nasa.gov/image/PIA01551/PIA01551~orig.jpg",
    alt: "Sojourner rover on Mars",
  },
  {
    href: "/games/dodge",
    title: "Journey to Mars",
    text: "Fly three real NASA cruises and dodge the lasers.",
    img: "https://images-assets.nasa.gov/image/PIA00407/PIA00407~small.jpg",
    alt: "Mars seen from space",
  },
  {
    href: "/games/landing",
    title: "Mars Landing",
    text: "Land at five real NASA sites, then do the science.",
    img: "https://images-assets.nasa.gov/image/PIA04318/PIA04318~orig.jpg",
    alt: "Sojourner near rocks on the Martian surface",
  },
];

export default function GamesPage() {
  return (
    <GameShell
      title="Mission games"
      backHref="/"
      backLabel="Ask Cosmo"
    >
      <div className="games-grid">
        {GAMES.map((g) => (
          <Link key={g.href} href={g.href} className="game-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.img} alt={g.alt} draggable={false} />
            <span className="game-card__body">
              <span className="t-title">{g.title}</span>
              <span className="t-body-sm c-muted">{g.text}</span>
              <span className="t-label c-cyan">Play →</span>
            </span>
          </Link>
        ))}
      </div>
    </GameShell>
  );
}
