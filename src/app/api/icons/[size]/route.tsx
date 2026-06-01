import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = size === "512" ? 512 : 192;
  const fontSize = size === "512" ? 180 : 68;

  // Se o tenant tem logo customizada, redireciona para ela.
  // Funciona multi-tenant: cada clínica pode subir a própria logo.
  try {
    const tenantRes = await fetch(new URL("/api/tenant-publico", req.url));
    if (tenantRes.ok) {
      const tenant = await tenantRes.json();
      if (tenant.logoUrl) {
        const res = NextResponse.redirect(new URL(tenant.logoUrl, req.url), 307);
        res.headers.set("Cache-Control", "public, max-age=3600");
        return res;
      }
    }
  } catch {
    // Cai no fallback abaixo (gera ícone com "BC")
  }

  // Fallback: gera ícone com "BC" (marca do sistema) — usado quando a clínica
  // não subiu logo própria ainda.
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
    { width: px, height: px, headers: { "Cache-Control": "public, max-age=86400, immutable" } }
  );
}
