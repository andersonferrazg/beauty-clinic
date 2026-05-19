import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const procedimento = await prisma.procedimento.findFirst({
    where: { id, tenantId: sessao.tenantId },
    include: {
      profissional: { select: { id: true, nome: true, cor: true, registro: true } },
      fotos: { orderBy: { criadoEm: "asc" } },
    },
  });

  if (!procedimento) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  return NextResponse.json(procedimento);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  const procedimento = await prisma.procedimento.update({
    where: { id, tenantId: sessao.tenantId },
    data: {
      ...(body.profissionalId !== undefined ? { profissionalId: body.profissionalId } : {}),
      ...(body.data !== undefined ? { data: new Date(body.data) } : {}),
      ...(body.tipo !== undefined ? { tipo: body.tipo } : {}),
      ...(body.descricao !== undefined ? { descricao: body.descricao } : {}),
      ...(body.produtosUsados !== undefined ? { produtosUsados: body.produtosUsados } : {}),
      ...(body.anamnese !== undefined ? { anamnese: JSON.stringify(body.anamnese) } : {}),
      ...(body.assinaturaPaciente !== undefined ? { assinaturaPaciente: body.assinaturaPaciente } : {}),
      ...(body.assinaturaProfissional !== undefined ? { assinaturaProfissional: body.assinaturaProfissional } : {}),
      ...(body.termoAceito !== undefined ? { termoAceito: body.termoAceito } : {}),
    },
    include: {
      profissional: { select: { id: true, nome: true, cor: true, registro: true } },
      fotos: { orderBy: { criadoEm: "asc" } },
    },
  });

  return NextResponse.json(procedimento);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  await prisma.procedimento.delete({ where: { id, tenantId: sessao.tenantId } });
  return new NextResponse(null, { status: 204 });
}
