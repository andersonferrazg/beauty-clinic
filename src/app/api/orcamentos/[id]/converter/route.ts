import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, temPermissao } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await exigirSessao();
  if (!temPermissao(sessao, "acessarFinanceiro")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const orcamento = await prisma.orcamento.findFirst({
    where: { id, tenantId: sessao.tenantId },
    include: { itens: true },
  });
  if (!orcamento) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  if (orcamento.agendamentoId) {
    return NextResponse.json(
      { erro: "Este orçamento já foi convertido em agendamento" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const {
    profissionalId,
    inicio,
    fim,
  }: { profissionalId: string; inicio: string; fim: string } = body;

  if (!profissionalId || !inicio || !fim) {
    return NextResponse.json(
      { erro: "Profissional, início e fim são obrigatórios" },
      { status: 400 }
    );
  }

  const itensServico = orcamento.itens.filter((i) => i.servicoId);

  const agendamento = await prisma.agendamento.create({
    data: {
      tenantId: sessao.tenantId,
      profissionalId,
      clienteId: orcamento.clienteId,
      inicio: new Date(inicio),
      fim: new Date(fim),
      observacao: orcamento.observacao || null,
      valorTotal: orcamento.valorTotal,
      itens: itensServico.length
        ? {
            create: itensServico.map((i) => ({
              servicoId: i.servicoId!,
              preco: i.preco,
              quantidade: i.quantidade,
            })),
          }
        : undefined,
    },
  });

  const atualizado = await prisma.orcamento.update({
    where: { id },
    data: {
      agendamentoId: agendamento.id,
      status: "APROVADO",
    },
    include: {
      cliente: { select: { id: true, nome: true } },
      profissional: { select: { id: true, nome: true } },
      itens: { include: { servico: true } },
      agendamento: { select: { id: true, inicio: true } },
    },
  });

  return NextResponse.json(atualizado);
}
