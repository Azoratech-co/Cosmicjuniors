import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import LaserDodge from "@/components/games/LaserDodge";

export const metadata: Metadata = {
  title: "Journey to Mars · Cosmic Juniors",
  description: "Fly the real cruises of Pathfinder, Spirit and Perseverance from Earth to Mars, dodge lasers and collect NASA facts.",
  openGraph: { title: "Journey to Mars · Cosmic Juniors", description: "Fly the real cruises of Pathfinder, Spirit and Perseverance from Earth to Mars, dodge lasers and collect NASA facts.", url: "/games/dodge", siteName: "Cosmic Juniors", type: "website", images: ["/games/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "Journey to Mars · Cosmic Juniors", description: "Fly the real cruises of Pathfinder, Spirit and Perseverance from Earth to Mars, dodge lasers and collect NASA facts.", images: ["/games/opengraph-image"] },
};

export default function DodgePage() {
  return (
    <GameShell title="Journey to Mars">
      <LaserDodge />
    </GameShell>
  );
}
