import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const lead = await prisma.lead.findFirst({ where: { id, tenantId: sessao.tenantId } });
  if (!lead) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  if (lead.clienteId) {
    return NextResponse.json({ erro: "Lead já convertido", clienteId: lead.clienteId }, { status: 409 });
  }

  const [cliente] = await prisma.$transaction([
    prisma.cliente.create({
      data: {
        tenantId: sessao.tenantId,
        nome: lead.nome,
        telefone1: lead.telefone || null,
        email: lead.email || null,
      },
    }),
  ]);

  await prisma.lead.update({
    where: { id },
    data: { estagio: "CONVERTIDO", clienteId: cliente.id },
  });

  return NextResponse.json({ clienteId: cliente.id }, { status: 201 });
}
