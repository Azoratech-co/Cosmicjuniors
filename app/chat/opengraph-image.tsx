import { ImageResponse } from "next/og";
import { ChatPreview, OG_SIZE, ogFonts } from "@/lib/og-juniors";

export const alt = "Ask Cosmo: an AI space guide with real NASA sources";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(<ChatPreview />, { ...size, fonts: await ogFonts() });
}
