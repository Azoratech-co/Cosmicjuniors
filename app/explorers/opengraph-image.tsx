import { ImageResponse } from "next/og";
import { DRAW, OG_SIZE, PagePreview, ogFonts } from "@/lib/og-sand";
import { EXPLORERS } from "@/lib/explorers";

export const alt = "Mars & Moon Explorers: the rovers and landers NASA left behind";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const mars = EXPLORERS.filter((e) => e.world === "mars").length;
  const moon = EXPLORERS.length - mars;
  return new ImageResponse(
    <PagePreview
      eyebrow="The explorers"
      title="Left on Mars & the Moon"
      text="Meet the rovers and landers NASA left behind, and find out where they are today."
      tag={{ label: "Collection", no: `${EXPLORERS.length} items`, name: "The Explorers", lines: [`${mars} on Mars`, `${moon} on the Moon`, "Sojourner, Spirit, InSight…"], draw: DRAW.rover }}
    />,
    { ...size, fonts: await ogFonts() },
  );
}
