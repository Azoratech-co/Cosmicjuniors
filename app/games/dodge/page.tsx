import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import LaserDodge from "@/components/games/LaserDodge";

export const metadata: Metadata = {
  title: "Laser Dodge · Cosmic Juniors",
  description: "Fly from Earth to Mars and dodge the lasers with the arrow keys.",
};

export default function DodgePage() {
  return (
    <GameShell title="Laser Dodge" tagline="Fly from Earth to Mars. Use the arrow keys to dodge the lasers and keep your shields up.">
      <LaserDodge />
    </GameShell>
  );
}
