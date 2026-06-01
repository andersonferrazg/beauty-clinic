import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin) return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  await prisma.formaPagamento.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: {
      nome: body.nome,
      percentualTaxa: body.percentualTaxa !== undefined ? Number(body.percentualTaxa) : undefined,
      ativa: body.ativa !== undefined ? Boolean(body.ativa) : undefined,
      ordem: body.ordem !== undefined ? Number(body.ordem) : undefined,
      ...(body.configJson !== undefined ? { configJson: body.configJson } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin) return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  const { id } = await params;

  // Soft delete para preservar histórico nos lançamentos
  await prisma.formaPagamento.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: { ativa: false },
  });

  return new NextResponse(null, { status: 204 });
}
