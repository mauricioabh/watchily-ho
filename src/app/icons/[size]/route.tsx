import { ImageResponse } from "next/og";

type IconVariant = {
  size: number;
  maskable: boolean;
};

const VARIANTS: Record<string, IconVariant> = {
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  "maskable-192": { size: 192, maskable: true },
  "maskable-512": { size: 512, maskable: true },
};

export function generateStaticParams(): { size: string }[] {
  return Object.keys(VARIANTS).map((size) => ({ size }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
): Promise<Response> {
  const { size: sizeParam } = await params;
  const variant = VARIANTS[sizeParam];

  if (!variant) {
    return new Response("Not found", { status: 404 });
  }

  const { size, maskable } = variant;
  // Maskable icons keep the glyph inside the safe zone (~80% of the canvas)
  // so platform masks never clip it. Non-maskable can fill more of the frame.
  const glyphSize = maskable
    ? Math.round(size * 0.42)
    : Math.round(size * 0.58);
  const radius = maskable ? 0 : Math.round(size * 0.22);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
        background:
          "linear-gradient(145deg, #142a5a 0%, #0b1120 55%, #05070d 100%)",
      }}
    >
      <div
        style={{
          fontSize: glyphSize,
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
    { width: size, height: size },
  );
}
