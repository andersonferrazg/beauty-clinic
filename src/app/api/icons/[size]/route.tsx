import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { iniciaisDoNome } from "@/lib/iniciais";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = size === "512" ? 512 : 192;
  const fontSize = size === "512" ? 180 : 68;

  const tenant = await prisma.tenant.findFirst({
    where: { ativo: true },
    orderBy: { criadoEm: "asc" },
    select: { nome: true, corPrimaria: true },
  });

  const iniciais = iniciaisDoNome(tenant?.nome ?? "Beauty Clinic");
  const cor1 = tenant?.corPrimaria ?? "#B89968";
  const cor2 = "#9a7d50";

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          borderRadius: px,
          background: `linear-gradient(135deg, ${cor1} 0%, ${cor2} 100%)`,
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
          {iniciais}
        </span>
      </div>
    ),
    { width: px, height: px }
  );
}
