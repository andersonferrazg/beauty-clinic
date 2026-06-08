import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, temPermissao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!temPermissao(sessao, "acessarNotasFiscais")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const profissionalId = searchParams.get("profissionalId");
  const formasParam = searchParams.get("formas") ?? "";
  const apenasNaoEmitidas = searchParams.get("apenasNaoEmitidas") === "true";

  if (!inicio || !fim) {
    return NextResponse.json({ erro: "inicio e fim são obrigatórios (YYYY-MM-DD)" }, { status: 400 });
  }

  const inicioDate = new Date(inicio + "T00:00:00");
  const fimDate = new Date(fim + "T23:59:59");
  const formas = formasParam ? formasParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const atendimentos = await prisma.agendamento.findMany({
    where: {
      tenantId: sessao.tenantId,
      lancamentoId: { not: null },
      dataRealizado: { gte: inicioDate, lte: fimDate },
      ...(profissionalId ? { profissionalId } : {}),
      ...(formas.length > 0 ? { formaPagamento: { in: formas } } : {}),
      ...(apenasNaoEmitidas ? { nfEmitida: false } : {}),
    },
    include: {
      cliente: { select: { id: true, nome: true, cpf: true, telefone1: true } },
      profissional: { select: { id: true, nome: true } },
      itens: {
        select: {
          servicoId: true,
          preco: true,
          quantidade: true,
          servico: { select: { nome: true } },
        },
      },
      lancamento: { select: { valor: true, valorBruto: true, formaPagamento: true } },
    },
    orderBy: { dataRealizado: "desc" },
  });

  // Calcula totais e breakdown
  let totalValor = 0;
  let totalEmitidas = 0;
  let valorEmitidas = 0;
  const breakdownFormas: Record<string, { valor: number; count: number }> = {};

  const linhas = atendimentos.map((a) => {
    const servicos = a.itens
      .filter((i) => i.servicoId !== null)
      .map((i) => i.servico?.nome ?? "—");
    const valor = a.lancamento?.valor ?? a.valorTotal ?? 0;
    const forma = a.formaPagamento ?? a.lancamento?.formaPagamento ?? "—";

    totalValor += valor;
    if (a.nfEmitida) { totalEmitidas++; valorEmitidas += valor; }
    if (!breakdownFormas[forma]) breakdownFormas[forma] = { valor: 0, count: 0 };
    breakdownFormas[forma].valor += valor;
    breakdownFormas[forma].count++;

    return {
      id: a.id,
      data: a.dataRealizado,
      clienteNome: a.cliente?.nome ?? "—",
      clienteCpf: a.cliente?.cpf ?? null,
      clienteTelefone: a.cliente?.telefone1 ?? null,
      profissionalNome: a.profissional.nome,
      servicos,
      valor,
      formaPagamento: forma,
      nfEmitida: a.nfEmitida,
      nfEmitidaEm: a.nfEmitidaEm,
    };
  });

  return NextResponse.json({
    atendimentos: linhas,
    totais: { valor: totalValor, count: linhas.length, emitidas: totalEmitidas, valorEmitidas },
    breakdownFormas,
  });
}
