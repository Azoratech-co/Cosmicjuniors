import { ImageResponse } from "next/og";
import { OG_SIZE, TitlePreview, ogFonts, publicImage } from "@/lib/og-juniors";
import { STORY_IDS, getStory } from "@/lib/storyline";

export const alt = "A Cosmic Juniors story";
export const size = OG_SIZE;
export const contentType = "image/png";
export const generateStaticParams = () => STORY_IDS.map((id) => ({ id }));

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const s = getStory((await params).id);
  const art = await publicImage("figma/hero-mars.svg", "image/svg+xml");
  const [name, sub] = (s?.title ?? "Storyline").split(":");
  return new ImageResponse(
    <TitlePreview
      eyebrow={`Storyline · by ${s?.authors ?? "the team"}`}
      title={name}
      text={`${sub?.trim() ?? ""}. ${s?.chapters.length ?? 0} chapters, with read-aloud and NASA photos.`}
      art={art}
      artW={500}
      artH={313}
    />,
    { ...size, fonts: await ogFonts() },
  );
}
