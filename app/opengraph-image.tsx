import { ImageResponse } from "next/og";
import { OG_SIZE, PreviewCard } from "@/lib/og";

// Link preview for the main page (WhatsApp, Slack, iMessage, X, LinkedIn...).
export const alt = "Ask Cosmo: NASA-sourced answers about the machines NASA left on Mars and the Moon";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <PreviewCard
        eyebrow="Cosmic Juniors"
        title="Ask Cosmo"
        text="Your AI space guide. Real NASA facts and sources about the rovers and landers NASA left on Mars and the Moon."
      />
    ),
    size,
  );
}
