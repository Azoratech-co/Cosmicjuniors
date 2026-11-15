import { ImageResponse } from "next/og";
import { DRAW, OG_SIZE, PagePreview, ogFonts } from "@/lib/og-cosmic";

export const alt = "Mission Games: Sojourner Puzzle, Journey to Mars, Mars Pathfinder Landing and Dust Storm Entry";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <PagePreview
      eyebrow="Mission games"
      title="Play the missions"
      text="Rebuild Sojourner, fly to Mars, and land at real NASA sites."
      tag={{ label: "Missions", no: "4 games", name: "Mission Games", lines: ["Sojourner Puzzle", "Journey to Mars", "Pathfinder Landing", "Dust Storm Entry"], draw: DRAW.joystick, stamp: "Earn stars" }}
    />,
    { ...size, fonts: await ogFonts() },
  );
}
