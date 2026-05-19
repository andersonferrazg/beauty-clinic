import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { processarStatusAgendamento } from "@/lib/finalizar-agendamento";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const agendamento = await prisma.agendamento.findFirst({
    where: { id, tenantId: sessao.tenantId },
    include: {
      cliente: true,
      profissional: true,
      status: true,
      itens: { include: { servico: true } },
    },
  });

  if (!agendamento) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  return NextResponse.json(agendamento);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  const {
    itens,
    tipo,          // campo de UI — ignorado no banco
    motivoBloqueio,
    profissionalId,
    clienteId,
    statusId,
    inicio,
    fim,
    corCustom,
    observacao,
    formaPagamento,
    valorTotal,
  } = body;

  // tipo é ignorado; motivoBloqueio vai para observacao (igual ao POST)
  void tipo;

  // Aplica a atualização principal
  const agendamento = await prisma.agendamento.update({
    where: { id, tenantId: sessao.tenantId },
    data: {
      ...(profissionalId !== undefined ? { profissionalId } : {}),
      ...(clienteId !== undefined ? { clienteId: clienteId || null } : {}),
      ...(statusId !== undefined ? { statusId: statusId || null } : {}),
      ...(inicio ? { inicio: new Date(inicio) } : {}),
      ...(fim ? { fim: new Date(fim) } : {}),
      ...(corCustom !== undefined ? { corCustom: corCustom || null } : {}),
      ...(observacao !== undefined || motivoBloqueio !== undefined
        ? { observacao: observacao || motivoBloqueio || null }
        : {}),
      ...(formaPagamento !== undefined ? { formaPagamento: formaPagamento || null } : {}),
      ...(valorTotal !== undefined ? { valorTotal: valorTotal || null } : {}),
      ...(itens !== undefined
        ? {
            itens: {
              deleteMany: {},
              create: itens.map((item: { servicoId: string; preco: number }) => ({
                servicoId: item.servicoId,
                preco: item.preco,
                quantidade: 1,
              })),
            },
          }
        : {}),
    },
    include: {
      cliente: { select: { id: true, nome: true } },
      profissional: { select: { id: true, nome: true, cor: true } },
      status: true,
      itens: { include: { servico: true } },
    },
  });

  // Trigger de finalização/reversão se o statusId mudou
  if (statusId !== undefined) {
    try {
      await processarStatusAgendamento(id, sessao.tenantId, statusId);
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : "Erro ao processar status";
      return NextResponse.json({ erro: mensagem }, { status: 400 });
    }
  }

  // Recarrega com lancamento atualizado
  const atualizado = await prisma.agendamento.findFirst({
    where: { id, tenantId: sessao.tenantId },
    include: {
      cliente: { select: { id: true, nome: true } },
      profissional: { select: { id: true, nome: true, cor: true } },
      status: true,
      itens: { include: { servico: true } },
      lancamento: true,
    },
  });

  return NextResponse.json(atualizado ?? agendamento);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  // Se foi finalizado, reverte (devolve estoque, deleta lancamento e comissões) antes de excluir
  const ag = await prisma.agendamento.findFirst({
    where: { id, tenantId: sessao.tenantId },
    select: { dataRealizado: true, lancamentoId: true },
  });

  if (ag?.dataRealizado) {
    try {
      await processarStatusAgendamento(id, sessao.tenantId, null);
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : "Erro ao reverter atendimento";
      return NextResponse.json({ erro: mensagem }, { status: 400 });
    }
  }

  await prisma.agendamento.delete({ where: { id, tenantId: sessao.tenantId } });
  return new NextResponse(null, { status: 204 });
}
