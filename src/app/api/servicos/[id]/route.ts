import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const servico = await prisma.servico.findFirst({
    where: { id, tenantId: sessao.tenantId, ativo: true },
  });

  if (!servico) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  return NextResponse.json(servico);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  const servico = await prisma.servico.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: {
      nome: body.nome,
      categoria: body.categoria ?? null,
      duracaoMin: body.duracaoMin ? Number(body.duracaoMin) : 60,
      preco: body.preco != null ? Number(body.preco) : 0,
      precoVariavel: body.precoVariavel ?? false,
      cor: body.cor ?? "#B89968",
      descricao: body.descricao ?? null,
    },
  });

  return NextResponse.json(servico);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  await prisma.servico.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: { ativo: false },
  });

  return new NextResponse(null, { status: 204 });
}
