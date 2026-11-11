import { ImageResponse } from "next/og";
import { OG_SIZE, SitePreview, ogFonts, publicImage } from "@/lib/og-juniors";

// Link preview for the whole website (WhatsApp, Instagram, Slack, iMessage, X, LinkedIn...).
export const alt = "Cosmic Juniors: stories and facts about the machines NASA left on Mars and the Moon";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const photo = await publicImage("figma/og-sojourner.jpg", "image/jpeg");
  return new ImageResponse(<SitePreview photo={photo} />, { ...size, fonts: await ogFonts() });
}
