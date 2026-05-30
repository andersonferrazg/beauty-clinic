import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findFirst({
    where: { slug, ativo: true },
    select: { id: true, configuracoes: { select: { agendamentoOnlineAtivo: true } } },
  });

  if (!tenant || !tenant.configuracoes?.agendamentoOnlineAtivo) {
    return NextResponse.json({ erro: "Agendamento online indisponível" }, { status: 403 });
  }

  const servicos = await prisma.servico.findMany({
    where: { tenantId: tenant.id, ativo: true, disponivelOnline: true },
    select: { id: true, nome: true, duracaoMin: true, preco: true, categoria: true },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(servicos);
}
