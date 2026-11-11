import { ImageResponse } from "next/og";
import { OG_SIZE, SitePreview, ogFonts } from "@/lib/og-cosmic";

// Link preview for the whole website (WhatsApp, Instagram, Slack, iMessage, X, LinkedIn...).
export const alt = "Cosmic Juniors: the machines NASA left behind on Mars and the Moon, and the stories they still tell";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(<SitePreview />, { ...size, fonts: await ogFonts() });
}
