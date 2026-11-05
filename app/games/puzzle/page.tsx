import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import SojournerPuzzle from "@/components/games/SojournerPuzzle";

export const metadata: Metadata = {
  title: "Sojourner Puzzle · Cosmic Juniors",
  description: "Rebuild a real NASA photo of Sojourner, the first rover to drive on Mars.",
};

export default function PuzzlePage() {
  return (
    <GameShell
      title="Sojourner Puzzle"
      tagline="A real NASA photo of Sojourner is in pieces. Drag each piece to its spot, or tap a piece and then tap where it goes."
    >
      <SojournerPuzzle />
    </GameShell>
  );
}
