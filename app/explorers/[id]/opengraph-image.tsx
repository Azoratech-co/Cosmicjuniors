import { ImageResponse } from "next/og";
import { DRAW, OG_SIZE, PagePreview, ogFonts } from "@/lib/og-cosmic";
import { EXPLORERS, getExplorer } from "@/lib/explorers";
import { getTopic } from "@/lib/cosmo/knowledge";

export const alt = "A NASA explorer on Cosmic Juniors";
export const size = OG_SIZE;
export const contentType = "image/png";
export const generateStaticParams = () => EXPLORERS.map((e) => ({ id: e.id }));

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const e = getExplorer(id)!;
  const i = EXPLORERS.findIndex((x) => x.id === id);
  const where = getTopic(e.main)?.whereNow?.place ?? (e.world === "moon" ? "The Moon" : "Mars");
  const draw = e.kind === "Rover" ? DRAW.rover : e.kind === "Lander" ? DRAW.lander : DRAW.flag;
  return new ImageResponse(
    <PagePreview
      eyebrow={`${e.world === "moon" ? "Moon" : "Mars"} explorer · ${e.kind}`}
      title={e.title}
      text={e.tagline}
      tag={{ label: "Left behind", no: `No. ${String(i + 1).padStart(3, "0")}`, name: e.name, lines: [where, ...e.dates.map((d) => `${d.label}: ${d.value}`)], draw }}
    />,
    { ...size, fonts: await ogFonts() },
  );
}
