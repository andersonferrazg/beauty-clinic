import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();
  const lista = await prisma.fornecedor.findMany({
    where: { tenantId: sessao.tenantId, ativo: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }
  const { nome, contato } = await req.json();
  if (!nome?.trim()) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 });
  }
  const fornecedor = await prisma.fornecedor.create({
    data: { tenantId: sessao.tenantId, nome: nome.trim(), contato: contato || null },
  });
  return NextResponse.json(fornecedor, { status: 201 });
}
