import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, tenantId: sessao.tenantId },
    include: {
      profissional: { select: { id: true, nome: true, cor: true } },
      cliente: { select: { id: true, nome: true } },
      interacoes: { orderBy: { criadoEm: "desc" } },
    },
  });

  if (!lead) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  const lead = await prisma.lead.findFirst({ where: { id, tenantId: sessao.tenantId } });
  if (!lead) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  const { nome, telefone, email, origem, servicoInteresse, profissionalId, observacoes, estagio } = body;

  const atualizado = await prisma.lead.update({
    where: { id },
    data: {
      ...(nome !== undefined ? { nome: nome.trim() } : {}),
      ...(telefone !== undefined ? { telefone: telefone?.trim() || null } : {}),
      ...(email !== undefined ? { email: email?.trim() || null } : {}),
      ...(origem !== undefined ? { origem } : {}),
      ...(servicoInteresse !== undefined ? { servicoInteresse: servicoInteresse?.trim() || null } : {}),
      ...(profissionalId !== undefined ? { profissionalId: profissionalId || null } : {}),
      ...(observacoes !== undefined ? { observacoes: observacoes?.trim() || null } : {}),
      ...(estagio !== undefined ? { estagio } : {}),
    },
    include: {
      profissional: { select: { id: true, nome: true, cor: true } },
      cliente: { select: { id: true, nome: true } },
      interacoes: { orderBy: { criadoEm: "desc" } },
    },
  });

  return NextResponse.json(atualizado);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const lead = await prisma.lead.findFirst({ where: { id, tenantId: sessao.tenantId } });
  if (!lead) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
