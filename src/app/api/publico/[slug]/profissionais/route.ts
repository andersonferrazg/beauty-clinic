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

  const profissionais = await prisma.profissional.findMany({
    where: { tenantId: tenant.id, ativo: true, possuiAgenda: true, agendamentoOnlineAtivo: true },
    select: {
      id: true,
      nome: true,
      especialidade: true,
      cor: true,
      disponibilidades: { select: { diaSemana: true, horaInicio: true, horaFim: true } },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(profissionais);
}
