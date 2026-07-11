import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, #142a5a 0%, #0b1120 55%, #05070d 100%)",
      }}
    >
      <div
        style={{
          fontSize: 104,
          fontWeight: 800,
          color: "#3878ff",
          display: "flex",
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}
      >
        W
      </div>
    </div>,
    { ...size },
  );
}
