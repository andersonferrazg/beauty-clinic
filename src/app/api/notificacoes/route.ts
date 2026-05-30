import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();

  const notificacoes = await prisma.notificacaoSistema.findMany({
    where: { tenantId: sessao.tenantId },
    orderBy: { criadaEm: "desc" },
    take: 30,
  });

  return NextResponse.json(notificacoes);
}
