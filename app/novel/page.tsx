import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Crimson_Text } from "next/font/google";
import NovelReader from "./NovelReader";
import { withNovelEmphasis } from "./emphasis";
import manuscripts from "./manuscripts.json";

const prose = Crimson_Text({ subsets: ["latin"], weight: "400", variable: "--novel-prose-font" });
const display = Cormorant_Garamond({ subsets: ["latin"], weight: "600", style: ["normal", "italic"], variable: "--novel-display-font" });
const editions = manuscripts.map((edition) => ({ ...edition, chapters: withNovelEmphasis(edition.chapters) }));

export const metadata: Metadata = {
  title: "Novel · Cosmic Juniors",
  description: "Read or listen to Sojourner's story.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#171a20",
};

export default function NovelPage() {
  return <NovelReader editions={editions} fontClassName={prose.variable + " " + display.variable} />;
}
