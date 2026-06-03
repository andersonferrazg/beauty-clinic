import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const mes = req.nextUrl.searchParams.get("mes");
  const futuros = req.nextUrl.searchParams.get("futuros") === "true";
  if (!mes) return NextResponse.json({ top5: [], todos: [], total: 0, totalQtd: 0 });

  const [ano, m] = mes.split("-").map(Number);
  const inicio = new Date(ano, m - 1, 1);
  const fim    = new Date(ano, m, 0, 23, 59, 59);

  let whereAgendamento: Record<string, unknown> = {
    tenantId: sessao.tenantId,
    inicio: { gte: inicio, lte: fim },
  };

  if (!futuros) {
    // Apenas finalizados
    whereAgendamento.dataRealizado = { not: null };
  } else {
    // Finalizados + agendados futuros (excluir cancelados/não compareceu)
    const statusNegativo = await prisma.statusAgenda.findMany({
      where: { tenantId: sessao.tenantId, contaConfirmado: false },
      select: { id: true, nome: true },
    });
    const idsCancelado = statusNegativo
      .filter(s => /cancelad|não comparec/i.test(s.nome))
      .map(s => s.id);
    if (idsCancelado.length > 0) {
      whereAgendamento.statusId = { notIn: idsCancelado };
    }
  }

  const itens = await prisma.itemAgendamento.findMany({
    where: { agendamento: whereAgendamento },
    include: { servico: { select: { nome: true } } },
  });

  // Agrupa por nome do serviço
  const mapaServicos = new Map<string, { receita: number; qtd: number }>();
  for (const item of itens) {
    const nome = item.servico?.nome ?? "Serviço sem nome";
    const atual = mapaServicos.get(nome) ?? { receita: 0, qtd: 0 };
    mapaServicos.set(nome, {
      receita: atual.receita + item.preco * item.quantidade,
      qtd: atual.qtd + item.quantidade,
    });
  }

  const todos = Array.from(mapaServicos.entries())
    .map(([nome, { receita, qtd }]) => ({ nome, receita, qtd }))
    .sort((a, b) => b.receita - a.receita);

  const total    = todos.reduce((s, x) => s + x.receita, 0);
  const totalQtd = todos.reduce((s, x) => s + x.qtd, 0);

  return NextResponse.json({ top5: todos.slice(0, 5), todos, total, totalQtd });
}
