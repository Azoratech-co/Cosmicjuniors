import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import PathfinderLanding from "@/components/games/PathfinderLanding";

export const metadata: Metadata = {
  title: "Dust Storm Entry · Cosmic Juniors",
  description: "Guide Mars Pathfinder past four dust storms before the parachute opens.",
};

export default function DustStormLandingPage() {
  return (
    <GameShell title="Dust Storm Entry" showPlanet={false}>
      <PathfinderLanding stormEntry />
    </GameShell>
  );
}
