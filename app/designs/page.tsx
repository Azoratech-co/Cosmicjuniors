import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import DesignList from "./DesignList";

export const metadata: Metadata = {
  title: "Designs · Cosmic Juniors",
  description: "Every live design of Cosmic Juniors, side by side.",
};

export default function DesignsPage() {
  return (
    <GameShell title="Designs" backHref="/" backLabel="Ask Cosmo">
      <DesignList />
    </GameShell>
  );
}
