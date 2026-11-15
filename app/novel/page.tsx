import type { Metadata, Viewport } from "next";
import NovelReader from "./NovelReader";
import manuscripts from "./manuscripts.json";

export const metadata: Metadata = {
  title: "Novel · Cosmic Juniors",
  description: "Read or listen to two versions of Sojourner's story.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f5f1e9",
};

export default function NovelPage() {
  return <NovelReader editions={manuscripts} />;
}
