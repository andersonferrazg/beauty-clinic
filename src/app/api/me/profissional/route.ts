import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();
  if (!sessao.profissionalId) {
    return NextResponse.json({ erro: "Apenas profissionais podem acessar este recurso." }, { status: 403 });
  }

  const profissional = await prisma.profissional.findFirst({
    where: { id: sessao.profissionalId, tenantId: sessao.tenantId, ativo: true },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      cor: true,
      especialidade: true,
      agendamentoOnlineAtivo: true,
      emailNotificacoes: true,
      disponibilidades: {
        select: { diaSemana: true, horaInicio: true, horaFim: true, horaInicio2: true, horaFim2: true },
        orderBy: { diaSemana: "asc" },
      },
    },
  });

  if (!profissional) return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  return NextResponse.json(profissional);
}

export async function PATCH(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!sessao.profissionalId) {
    return NextResponse.json({ erro: "Apenas profissionais podem acessar este recurso." }, { status: 403 });
  }

  const body = await req.json();
  const id = sessao.profissionalId;

  await prisma.$transaction(async (tx) => {
    await tx.profissional.updateMany({
      where: { id, tenantId: sessao.tenantId },
      data: {
        agendamentoOnlineAtivo: typeof body.agendamentoOnlineAtivo === "boolean" ? body.agendamentoOnlineAtivo : undefined,
        emailNotificacoes: "emailNotificacoes" in body ? (body.emailNotificacoes || null) : undefined,
      },
    });

    if (Array.isArray(body.disponibilidades)) {
      await tx.disponibilidadeProfissional.deleteMany({ where: { profissionalId: id } });
      const dias = body.disponibilidades as { diaSemana: number; horaInicio: number; horaFim: number }[];
      if (dias.length > 0) {
        await tx.disponibilidadeProfissional.createMany({
          data: dias.map((d) => ({
            tenantId: sessao.tenantId,
            profissionalId: id,
            diaSemana: d.diaSemana,
            horaInicio: d.horaInicio,
            horaFim: d.horaFim,
          })),
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
