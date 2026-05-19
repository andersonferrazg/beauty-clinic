import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ clienteId: string }> }) {
  const sessao = await exigirSessao();
  const { clienteId } = await params;
  const body = await req.json();

  let prontuario = await prisma.prontuario.findUnique({ where: { clienteId } });
  if (!prontuario) {
    prontuario = await prisma.prontuario.create({
      data: { tenantId: sessao.tenantId, clienteId },
    });
  }

  const procedimento = await prisma.procedimento.create({
    data: {
      tenantId: sessao.tenantId,
      prontuarioId: prontuario.id,
      profissionalId: body.profissionalId,
      data: new Date(body.data),
      tipo: body.tipo,
      descricao: body.descricao ?? null,
      produtosUsados: body.produtosUsados ?? null,
      anamnese: body.anamnese ? JSON.stringify(body.anamnese) : null,
      assinaturaPaciente: body.assinaturaPaciente ?? null,
      assinaturaProfissional: body.assinaturaProfissional ?? null,
      termoAceito: body.termoAceito ?? false,
    },
    include: {
      profissional: { select: { id: true, nome: true, cor: true, registro: true } },
      fotos: true,
    },
  });

  return NextResponse.json(procedimento, { status: 201 });
}
