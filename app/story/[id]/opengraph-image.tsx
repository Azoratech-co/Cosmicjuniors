import { ImageResponse } from "next/og";
import { DRAW, OG_SIZE, PagePreview, ogFonts } from "@/lib/og-cosmic";
import { STORY_IDS, getStory } from "@/lib/storyline";

export const alt = "A Cosmic Juniors story";
export const size = OG_SIZE;
export const contentType = "image/png";
export const generateStaticParams = () => STORY_IDS.map((id) => ({ id }));

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const s = getStory(id)!;
  const [name, sub] = s.title.split(":");
  return new ImageResponse(
    <PagePreview
      eyebrow="Storyline"
      title={name}
      text={`${sub?.trim() ?? ""}. A Cosmic Juniors story, with read-aloud and NASA photos.`}
      tag={{
        label: "Story",
        no: `No. ${String(STORY_IDS.indexOf(id as (typeof STORY_IDS)[number]) + 1).padStart(3, "0")}`,
        name,
        lines: ["Cosmic Juniors Storyline", `${s.chapters.length} chapters`, s.status === "complete" ? "Complete" : "Still being written"],
        draw: DRAW.book,
        stamp: "Read the story",
      }}
    />,
    { ...size, fonts: await ogFonts() },
  );
}
