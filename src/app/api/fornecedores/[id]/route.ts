import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  const { id } = await params;
  const { nome, contato } = await req.json();
  await prisma.fornecedor.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: { nome: nome?.trim(), contato: contato || null },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  const { id } = await params;
  await prisma.fornecedor.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: { ativo: false },
  });
  return new NextResponse(null, { status: 204 });
}
