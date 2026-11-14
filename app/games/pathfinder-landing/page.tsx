import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import PathfinderLanding from "@/components/games/PathfinderLanding";

export const metadata: Metadata = {
  title: "Pathfinder Landing Simulator · Cosmic Juniors",
  description: "Follow Mars Pathfinder from deep space to Ares Vallis and land with a parachute, retrorockets, and airbags.",
};

export default function PathfinderLandingPage() {
  return (
    <GameShell title="Pathfinder landing simulator" showPlanet={false}>
      <PathfinderLanding />
    </GameShell>
  );
}
