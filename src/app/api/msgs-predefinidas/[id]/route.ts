import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  const msg = await prisma.mensagemPredefinida.findFirst({
    where: { id, tenantId: sessao.tenantId },
  });
  if (!msg) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });

  const atualizada = await prisma.mensagemPredefinida.update({
    where: { id },
    data: {
      ...(body.nome !== undefined ? { nome: body.nome.trim() } : {}),
      ...(body.texto !== undefined ? { texto: body.texto.trim() } : {}),
      ...(body.ordem !== undefined ? { ordem: body.ordem } : {}),
    },
  });
  return NextResponse.json(atualizada);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const msg = await prisma.mensagemPredefinida.findFirst({
    where: { id, tenantId: sessao.tenantId },
  });
  if (!msg) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });

  await prisma.mensagemPredefinida.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
