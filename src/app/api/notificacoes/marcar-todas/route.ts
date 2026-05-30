import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function POST() {
  const sessao = await exigirSessao();

  await prisma.notificacaoSistema.updateMany({
    where: { tenantId: sessao.tenantId, lida: false },
    data: { lida: true },
  });

  return NextResponse.json({ ok: true });
}
