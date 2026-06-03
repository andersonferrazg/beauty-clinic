import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

// Retorna atendimentos FUTUROS (não finalizados) do mês como receitas projetadas.
// Usado pelo toggle "dados futuros para o mês atual" do Resumo Financeiro.
export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const mes = req.nextUrl.searchParams.get("mes");
  if (!mes) return NextResponse.json([]);

  const [ano, m] = mes.split("-").map(Number);
  const inicio = new Date(ano, m - 1, 1);
  const fim    = new Date(ano, m, 0, 23, 59, 59);

  // Status que significam "não vai acontecer" (cancelado / não compareceu)
  const statusNegativo = await prisma.statusAgenda.findMany({
    where: { tenantId: sessao.tenantId, contaConfirmado: false },
    select: { id: true, nome: true },
  });
  const idsCancelado = statusNegativo
    .filter(s => /cancelad|não comparec/i.test(s.nome))
    .map(s => s.id);

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      tenantId: sessao.tenantId,
      dataRealizado: null,                 // não finalizado ainda
      inicio: { gte: inicio, lte: fim },
      ...(idsCancelado.length > 0 ? { statusId: { notIn: idsCancelado } } : {}),
    },
    include: {
      itens: true,
      cliente: { select: { nome: true } },
    },
  });

  return NextResponse.json(
    agendamentos.map((ag) => ({
      id: `proj-${ag.id}`,
      tipo: "RECEITA",
      categoria: "Atendimento",
      descricao: ag.cliente?.nome ?? "Atendimento",
      valor: ag.valorTotal ?? ag.itens.reduce((s, i) => s + i.preco * i.quantidade, 0),
      pago: false,
      formaPagamento: ag.formaPagamento ?? null,
      vencimento: ag.inicio.toISOString(),
      criadoEm: ag.inicio.toISOString(),
      projetado: true,
    })),
  );
}
