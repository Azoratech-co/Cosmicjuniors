import { ImageResponse } from "next/og";
import { DRAW, OG_SIZE, PagePreview, ogFonts } from "@/lib/og-sand";

export const alt = "Mission Games: Sojourner Puzzle, Journey to Mars and Mars Landing";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <PagePreview
      eyebrow="Mission games"
      title="Play the missions"
      text="Rebuild Sojourner, fly to Mars, and land at real NASA sites."
      tag={{ label: "Missions", no: "3 games", name: "Mission Games", lines: ["Sojourner Puzzle", "Journey to Mars", "Mars Landing"], draw: DRAW.joystick, stamp: "Earn stars" }}
    />,
    { ...size, fonts: await ogFonts() },
  );
}
