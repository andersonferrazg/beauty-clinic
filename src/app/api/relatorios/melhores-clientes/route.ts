import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const { searchParams } = new URL(req.url);

  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const tipo = searchParams.get("tipo") || "receita";

  if (!inicio || !fim) {
    return NextResponse.json({ erro: "inicio e fim são obrigatórios" }, { status: 400 });
  }

  const inicioDate = new Date(inicio + "T00:00:00");
  const fimDate = new Date(fim + "T23:59:59");

  const [totalClientes, primeiroAtendimentosPorCliente, agendamentos] = await Promise.all([
    prisma.cliente.count({
      where: { tenantId: sessao.tenantId, ativo: true },
    }),
    prisma.agendamento.groupBy({
      by: ["clienteId"],
      where: {
        tenantId: sessao.tenantId,
        clienteId: { not: null },
        dataRealizado: { not: null },
      },
      _min: { inicio: true },
    }),
    prisma.agendamento.findMany({
      where: {
        tenantId: sessao.tenantId,
        lancamentoId: { not: null },
        clienteId: { not: null },
        inicio: { gte: inicioDate, lte: fimDate },
      },
      include: {
        cliente: {
          select: { id: true, nome: true, telefone1: true, dataNascimento: true },
        },
        lancamento: { select: { valor: true } },
      },
    }),
  ]);

  const map = new Map<
    string,
    {
      id: string;
      nome: string;
      telefone1: string | null;
      dataNascimento: Date | null;
      receita: number;
      atendimentos: number;
    }
  >();

  for (const ag of agendamentos) {
    if (!ag.cliente) continue;
    const key = ag.cliente.id;
    if (!map.has(key)) {
      map.set(key, {
        id: ag.cliente.id,
        nome: ag.cliente.nome,
        telefone1: ag.cliente.telefone1,
        dataNascimento: ag.cliente.dataNascimento,
        receita: 0,
        atendimentos: 0,
      });
    }
    const entry = map.get(key)!;
    entry.atendimentos++;
    entry.receita += ag.lancamento?.valor ?? 0;
  }

  // Clientes cujo primeiro atendimento realizado foi dentro do período selecionado
  const novosClientes = primeiroAtendimentosPorCliente.filter((g) => {
    const primeira = g._min.inicio;
    return primeira && primeira >= inicioDate && primeira <= fimDate;
  }).length;

  let ranking = Array.from(map.values());
  ranking.sort((a, b) =>
    tipo === "receita" ? b.receita - a.receita : b.atendimentos - a.atendimentos
  );
  ranking = ranking.slice(0, 30);

  return NextResponse.json({ totalClientes, novosClientes, ranking });
}
