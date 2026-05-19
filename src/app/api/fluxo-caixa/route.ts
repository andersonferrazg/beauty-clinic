import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { processarRecorrenciasMensais } from "@/lib/recorrencia-financeira";

/**
 * Projeção de fluxo de caixa.
 * GET /api/fluxo-caixa?dias=30|60|90
 *
 * Retorna saldo projetado dia a dia considerando:
 *  - entradas/saídas com vencimento no período
 *  - recorrências mensais já materializadas
 *  - saldo inicial = soma de pagos até a data atual
 */
export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const dias = Number(req.nextUrl.searchParams.get("dias") ?? 30);
  const limite = Math.min(Math.max(dias, 7), 180);

  await processarRecorrenciasMensais(sessao.tenantId);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = new Date(hoje);
  fim.setDate(fim.getDate() + limite);

  // Saldo atual = receitas pagas - despesas pagas (histórico todo)
  const [receitasPagas, despesasPagas] = await Promise.all([
    prisma.lancamento.aggregate({
      where: { tenantId: sessao.tenantId, tipo: "RECEITA", pago: true },
      _sum: { valor: true },
    }),
    prisma.lancamento.aggregate({
      where: { tenantId: sessao.tenantId, tipo: "DESPESA", pago: true },
      _sum: { valor: true },
    }),
  ]);
  const saldoAtual = (receitasPagas._sum.valor ?? 0) - (despesasPagas._sum.valor ?? 0);

  // Lançamentos futuros com vencimento no período (pagos ou não)
  const futuros = await prisma.lancamento.findMany({
    where: {
      tenantId: sessao.tenantId,
      vencimento: { gte: hoje, lte: fim },
    },
    orderBy: { vencimento: "asc" },
    select: {
      id: true,
      tipo: true,
      categoria: true,
      descricao: true,
      valor: true,
      vencimento: true,
      pago: true,
    },
  });

  // Agrupa por dia
  const porDia: Record<string, { receita: number; despesa: number; itens: typeof futuros }> = {};
  for (const f of futuros) {
    if (!f.vencimento) continue;
    const chave = f.vencimento.toISOString().slice(0, 10);
    if (!porDia[chave]) porDia[chave] = { receita: 0, despesa: 0, itens: [] };
    if (f.tipo === "RECEITA") porDia[chave].receita += f.valor;
    else porDia[chave].despesa += f.valor;
    porDia[chave].itens.push(f);
  }

  // Constrói série dia a dia
  const serie: { data: string; receita: number; despesa: number; saldo: number; itens: typeof futuros }[] = [];
  let saldoProjetado = saldoAtual;
  for (let d = 0; d < limite; d++) {
    const dt = new Date(hoje);
    dt.setDate(dt.getDate() + d);
    const chave = dt.toISOString().slice(0, 10);
    const dia = porDia[chave] ?? { receita: 0, despesa: 0, itens: [] };
    saldoProjetado += dia.receita - dia.despesa;
    serie.push({ data: chave, receita: dia.receita, despesa: dia.despesa, saldo: saldoProjetado, itens: dia.itens });
  }

  const totalReceita = serie.reduce((s, d) => s + d.receita, 0);
  const totalDespesa = serie.reduce((s, d) => s + d.despesa, 0);

  return NextResponse.json({
    saldoAtual,
    saldoFinal: saldoProjetado,
    totalReceita,
    totalDespesa,
    dias: serie,
  });
}
