import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import PathfinderLanding from "@/components/games/PathfinderLanding";

const description = "Fly Mars Pathfinder's real landing in 3D: atmospheric entry, parachute, airbags, retrorockets and bounces at Ares Vallis.";

export const metadata: Metadata = {
  title: "Mars Pathfinder Landing · Cosmic Juniors",
  description,
  openGraph: { title: "Mars Pathfinder Landing · Cosmic Juniors", description, url: "/games/landing", siteName: "Cosmic Juniors", type: "website", images: ["/games/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "Mars Pathfinder Landing · Cosmic Juniors", description, images: ["/games/opengraph-image"] },
};

export default function LandingPage() {
  return (
    <GameShell title="Mars Pathfinder Landing" showPlanet={false}>
      <PathfinderLanding />
    </GameShell>
  );
}
