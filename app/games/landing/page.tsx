import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import MarsLanding from "@/components/games/MarsLanding";

export const metadata: Metadata = {
  title: "Mars Landing · Cosmic Juniors",
  description: "Land at five real NASA sites on Mars, from Viking 1 to Perseverance, then do the science.",
  openGraph: { title: "Mars Landing · Cosmic Juniors", description: "Land at five real NASA sites on Mars, from Viking 1 to Perseverance, then do the science.", url: "/games/landing", siteName: "Cosmic Juniors", type: "website", images: ["/games/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "Mars Landing · Cosmic Juniors", description: "Land at five real NASA sites on Mars, from Viking 1 to Perseverance, then do the science.", images: ["/games/opengraph-image"] },
};

export default function LandingPage() {
  return (
    <GameShell
      title="Mars Landing"
      tagline="Five real NASA landing sites, from Viking 1 in 1976 to Perseverance in 2021. Land safely, do the science, and see where each mission rests today."
    >
      <MarsLanding />
    </GameShell>
  );
}
