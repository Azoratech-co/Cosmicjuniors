import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import MarsLanding from "@/components/games/MarsLanding";

export const metadata: Metadata = {
  title: "Mars Landing · Cosmic Juniors",
  description: "Drop the lander from the rocket, open the parachute and land the rover on Mars.",
  openGraph: { title: "Mars Landing · Cosmic Juniors", description: "Drop the lander from the rocket, open the parachute and land the rover on Mars.", url: "/games/landing", siteName: "Cosmic Juniors", type: "website", images: ["/games/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "Mars Landing · Cosmic Juniors", description: "Drop the lander from the rocket, open the parachute and land the rover on Mars.", images: ["/games/opengraph-image"] },
};

export default function LandingPage() {
  return (
    <GameShell
      title="Mars Landing"
      tagline="The rocket is flying over Mars. Drop the lander, open the parachute, and touch down gently in the landing zone."
    >
      <MarsLanding />
    </GameShell>
  );
}
