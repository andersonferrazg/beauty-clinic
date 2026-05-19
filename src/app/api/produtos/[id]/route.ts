import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  await prisma.produto.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: {
      nome: body.nome,
      categoria: body.categoria ?? null,
      precoVenda: body.precoVenda != null ? Number(body.precoVenda) : 0,
      precoCusto: body.precoCusto != null ? Number(body.precoCusto) : null,
      qtdEstoque: body.qtdEstoque != null ? Number(body.qtdEstoque) : 0,
      qtdMinima: body.qtdMinima != null ? Number(body.qtdMinima) : 0,
      patrimonio: body.patrimonio ?? false,
      dataValidade: body.dataValidade ? new Date(body.dataValidade) : null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  await prisma.produto.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: { ativo: false },
  });

  return new NextResponse(null, { status: 204 });
}
