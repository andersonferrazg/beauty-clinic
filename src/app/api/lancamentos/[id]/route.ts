import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  await prisma.lancamento.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: {
      tipo: body.tipo,
      categoria: body.categoria ?? null,
      descricao: body.descricao,
      valor: Number(body.valor),
      vencimento: body.vencimento ? new Date(body.vencimento) : null,
      pagoEm: body.pagoEm ? new Date(body.pagoEm) : null,
      pago: body.pago ?? false,
      recorrencia: body.recorrencia ?? null,
      formaPagamento: body.formaPagamento ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  await prisma.lancamento.deleteMany({
    where: { id, tenantId: sessao.tenantId },
  });

  return new NextResponse(null, { status: 204 });
}
