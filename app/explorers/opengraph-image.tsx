import { ImageResponse } from "next/og";
import { OG_SIZE, TitlePreview, ogFonts, publicImage } from "@/lib/og-juniors";

export const alt = "Mars & Moon Explorers: the rovers and landers NASA left behind";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const art = await publicImage("figma/hero-mars.svg", "image/svg+xml");
  return new ImageResponse(
    <TitlePreview eyebrow="Wiki" title="Mars & Moon Explorers" text="Meet the rovers and landers NASA left on Mars and the Moon, and find out where they are today." art={art} artW={500} artH={313} />,
    { ...size, fonts: await ogFonts() },
  );
}
