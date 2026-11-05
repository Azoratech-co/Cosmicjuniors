import { ImageResponse } from "next/og";
import { OG_SIZE, PreviewCard } from "@/lib/og";

// Link preview for /games and the three game pages under it.
export const alt = "Mission Games: Sojourner Puzzle, Journey to Mars and Mars Landing";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <PreviewCard
        eyebrow="Mission Games"
        title="Play the Mars missions"
        text="Three browser games built on real NASA missions. Win to unlock NASA facts."
        chips={["Sojourner Puzzle", "Journey to Mars", "Mars Landing"]}
      />
    ),
    size,
  );
}
