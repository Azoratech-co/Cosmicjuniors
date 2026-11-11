import { ImageResponse } from "next/og";
import { OG_SIZE, TitlePreview, ogFonts, publicImage } from "@/lib/og-juniors";
import { EXPLORERS, getExplorer } from "@/lib/explorers";

export const alt = "A NASA explorer on Cosmic Juniors";
export const size = OG_SIZE;
export const contentType = "image/png";
export const generateStaticParams = () => EXPLORERS.map((e) => ({ id: e.id }));

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const e = getExplorer((await params).id);
  const moon = e?.world === "moon";
  const art = await publicImage(moon ? "figma/hero-moon.svg" : "figma/hero-mars.svg", "image/svg+xml");
  return new ImageResponse(
    <TitlePreview
      eyebrow={`${moon ? "Moon" : "Mars"} explorer · ${e?.kind ?? ""}`}
      title={e?.title ?? "Explorer"}
      text={e?.tagline ?? ""}
      art={art}
      artW={500}
      artH={moon ? 280 : 313}
    />,
    { ...size, fonts: await ogFonts() },
  );
}
