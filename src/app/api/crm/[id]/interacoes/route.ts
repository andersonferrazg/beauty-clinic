import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const { tipo, texto } = await req.json();

  const lead = await prisma.lead.findFirst({ where: { id, tenantId: sessao.tenantId } });
  if (!lead) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  if (!texto?.trim()) {
    return NextResponse.json({ erro: "Texto é obrigatório" }, { status: 400 });
  }

  const interacao = await prisma.interacaoLead.create({
    data: { leadId: id, tipo: tipo || "NOTA", texto: texto.trim() },
  });

  return NextResponse.json(interacao, { status: 201 });
}
