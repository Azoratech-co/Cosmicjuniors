import { ImageResponse } from "next/og";
import { OG_SIZE, TitlePreview, ogFonts, publicImage } from "@/lib/og-juniors";

export const alt = "Mission Games: Sojourner Puzzle, Journey to Mars and Mars Landing";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const art = await publicImage("figma/hero-mars.svg", "image/svg+xml");
  return new ImageResponse(
    <TitlePreview eyebrow="Mission games" title="Play the Mars missions" text="Rebuild Sojourner, fly to Mars, and land at real NASA sites." chips={["Puzzle", "Journey to Mars", "Mars Landing"]} art={art} artW={500} artH={313} />,
    { ...size, fonts: await ogFonts() },
  );
}
