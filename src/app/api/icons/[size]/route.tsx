import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = size === "512" ? 512 : 192;
  const fontSize = size === "512" ? 180 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          borderRadius: px,
          background: "linear-gradient(135deg, #B89968 0%, #9a7d50 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize,
            fontWeight: 700,
            letterSpacing: "-2px",
            fontFamily: "serif",
          }}
        >
          BC
        </span>
      </div>
    ),
    { width: px, height: px }
  );
}
