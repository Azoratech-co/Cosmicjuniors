import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import SojournerPuzzle from "@/components/games/SojournerPuzzle";

export const metadata: Metadata = {
  title: "Sojourner Puzzle · Cosmic Juniors",
  description: "Rebuild a real NASA photo of Sojourner, the first rover to drive on Mars.",
  openGraph: { title: "Sojourner Puzzle · Cosmic Juniors", description: "Rebuild a real NASA photo of Sojourner, the first rover to drive on Mars.", url: "/games/puzzle", siteName: "Cosmic Juniors", type: "website", images: ["/games/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "Sojourner Puzzle · Cosmic Juniors", description: "Rebuild a real NASA photo of Sojourner, the first rover to drive on Mars.", images: ["/games/opengraph-image"] },
};

export default function PuzzlePage() {
  return (
    <GameShell
      title="Sojourner Puzzle"
      tagline="Drag each piece to its spot, or tap a piece and then its spot."
    >
      <SojournerPuzzle />
    </GameShell>
  );
}
