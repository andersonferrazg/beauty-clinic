import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ clienteId: string }> }) {
  const sessao = await exigirSessao();
  const { clienteId } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: { id: clienteId, tenantId: sessao.tenantId },
  });
  if (!cliente) return NextResponse.json({ erro: "Cliente não encontrada" }, { status: 404 });

  let prontuario = await prisma.prontuario.findUnique({
    where: { clienteId },
    include: {
      procedimentos: {
        orderBy: { data: "desc" },
        include: {
          profissional: { select: { id: true, nome: true, cor: true, registro: true } },
          fotos: { orderBy: { criadoEm: "asc" } },
        },
      },
    },
  });

  // cria prontuário vazio se ainda não existe
  if (!prontuario) {
    await prisma.prontuario.create({ data: { tenantId: sessao.tenantId, clienteId } });
    prontuario = await prisma.prontuario.findUnique({
      where: { clienteId },
      include: { procedimentos: { include: { profissional: true, fotos: true } } },
    });
  }

  return NextResponse.json({ cliente, prontuario });
}
