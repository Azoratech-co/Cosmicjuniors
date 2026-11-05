import { ImageResponse } from "next/og";
import { COSMO_SRC } from "@/lib/og";

// iPhone / iPad home-screen icon.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b1026" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={COSMO_SRC} width={150} height={150} alt="" />
      </div>
    ),
    size,
  );
}
