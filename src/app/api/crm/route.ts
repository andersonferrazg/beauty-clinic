import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const { searchParams } = new URL(req.url);
  const estagio = searchParams.get("estagio") || "";
  const q = searchParams.get("q") || "";

  const leads = await prisma.lead.findMany({
    where: {
      tenantId: sessao.tenantId,
      ...(estagio ? { estagio } : {}),
      ...(q ? { nome: { contains: q } } : {}),
    },
    include: {
      profissional: { select: { id: true, nome: true, cor: true } },
      cliente: { select: { id: true } },
      interacoes: { orderBy: { criadoEm: "desc" }, take: 1 },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const body = await req.json();
  const { nome, telefone, email, origem, servicoInteresse, profissionalId, observacoes } = body;

  if (!nome?.trim()) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 });
  }

  const lead = await prisma.lead.create({
    data: {
      tenantId: sessao.tenantId,
      nome: nome.trim(),
      telefone: telefone?.trim() || null,
      email: email?.trim() || null,
      origem: origem || null,
      servicoInteresse: servicoInteresse?.trim() || null,
      profissionalId: profissionalId || null,
      observacoes: observacoes?.trim() || null,
    },
    include: {
      profissional: { select: { id: true, nome: true, cor: true } },
      interacoes: true,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}
