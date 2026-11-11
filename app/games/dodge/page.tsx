import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import JourneyToMars from "@/components/games/JourneyToMars";

export const metadata: Metadata = {
  title: "Journey to Mars · Cosmic Juniors",
  description: "Launch the real rockets of Pathfinder, Spirit and Perseverance, then cruise to Mars dodging meteoroids and collecting NASA facts.",
  openGraph: { title: "Journey to Mars · Cosmic Juniors", description: "Launch the real rockets of Pathfinder, Spirit and Perseverance, then cruise to Mars dodging meteoroids and collecting NASA facts.", url: "/games/dodge", siteName: "Cosmic Juniors", type: "website", images: ["/games/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "Journey to Mars · Cosmic Juniors", description: "Launch the real rockets of Pathfinder, Spirit and Perseverance, then cruise to Mars dodging meteoroids and collecting NASA facts.", images: ["/games/opengraph-image"] },
};

export default function DodgePage() {
  return (
    <GameShell title="Journey to Mars">
      <JourneyToMars />
    </GameShell>
  );
}
