import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();
  const msgs = await prisma.mensagemPredefinida.findMany({
    where: { tenantId: sessao.tenantId },
    orderBy: [{ ordem: "asc" }, { criadaEm: "asc" }],
  });
  return NextResponse.json(msgs);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const { nome, texto } = await req.json();
  if (!nome?.trim() || !texto?.trim()) {
    return NextResponse.json({ erro: "Nome e texto são obrigatórios" }, { status: 400 });
  }
  const ultima = await prisma.mensagemPredefinida.findFirst({
    where: { tenantId: sessao.tenantId },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const msg = await prisma.mensagemPredefinida.create({
    data: {
      tenantId: sessao.tenantId,
      nome: nome.trim(),
      texto: texto.trim(),
      ordem: (ultima?.ordem ?? -1) + 1,
    },
  });
  return NextResponse.json(msg, { status: 201 });
}
