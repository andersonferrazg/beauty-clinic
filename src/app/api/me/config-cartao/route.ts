import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();
  if (!sessao.profissionalId) return NextResponse.json({ configJsonCartao: null });

  const prof = await prisma.profissional.findFirst({
    where: { id: sessao.profissionalId, tenantId: sessao.tenantId },
    select: { configJsonCartao: true },
  });

  return NextResponse.json({ configJsonCartao: prof?.configJsonCartao ?? null });
}

export async function PATCH(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!sessao.profissionalId) return NextResponse.json({ erro: "Não é profissional" }, { status: 403 });

  const { configJsonCartao } = await req.json() as { configJsonCartao: string | null };

  await prisma.profissional.updateMany({
    where: { id: sessao.profissionalId, tenantId: sessao.tenantId },
    data: { configJsonCartao: configJsonCartao ?? null },
  });

  return NextResponse.json({ ok: true });
}
