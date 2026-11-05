import { ImageResponse } from "next/og";
import { ICON_SRC } from "@/lib/og";

// iPhone / iPad home-screen icon.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ICON_SRC} width={180} height={180} alt="" />
    ),
    size,
  );
}
