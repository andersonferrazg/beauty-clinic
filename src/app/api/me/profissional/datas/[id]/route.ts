import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const profId = sessao.profissionalId;
  if (!profId) return NextResponse.json({ erro: "Apenas profissionais." }, { status: 403 });

  const { id } = await params;

  await prisma.disponibilidadeData.deleteMany({
    where: { id, profissionalId: profId, tenantId: sessao.tenantId },
  });

  return new NextResponse(null, { status: 204 });
}
