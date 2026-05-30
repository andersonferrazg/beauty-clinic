import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  await prisma.notificacaoSistema.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: { lida: true },
  });

  return NextResponse.json({ ok: true });
}
