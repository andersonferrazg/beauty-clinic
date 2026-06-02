import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const { mes, categoria } = await req.json() as { mes: string; categoria: string };

  // mes = "2026-05"
  const [anoStr, mesStr] = mes.split("-");
  const ano = parseInt(anoStr);
  const mesNum = parseInt(mesStr);

  const inicio = new Date(ano, mesNum - 1, 1);
  const fim = new Date(ano, mesNum, 0, 23, 59, 59);

  // Calcular próximo mês
  const proxAno = mesNum === 12 ? ano + 1 : ano;
  const proxMes = mesNum === 12 ? 1 : mesNum + 1;
  const proxInicio = new Date(proxAno, proxMes - 1, 1);
  const proxFim = new Date(proxAno, proxMes, 0, 23, 59, 59);

  // Buscar itens do mês atual nessa categoria
  const itens = await prisma.lancamento.findMany({
    where: {
      tenantId: sessao.tenantId,
      categoria,
      OR: [
        { vencimento: { gte: inicio, lte: fim } },
        { AND: [{ vencimento: null }, { criadoEm: { gte: inicio, lte: fim } }] },
      ],
    },
  });

  // Buscar descricoes já existentes no próximo mês (para não duplicar)
  const existentes = await prisma.lancamento.findMany({
    where: {
      tenantId: sessao.tenantId,
      categoria,
      OR: [
        { vencimento: { gte: proxInicio, lte: proxFim } },
        { AND: [{ vencimento: null }, { criadoEm: { gte: proxInicio, lte: proxFim } }] },
      ],
    },
    select: { descricao: true },
  });
  const descExistentes = new Set(existentes.map((e) => e.descricao));

  let criados = 0;
  let ignorados = 0;

  for (const item of itens) {
    if (descExistentes.has(item.descricao)) {
      ignorados++;
      continue;
    }

    // Ajustar vencimento para o próximo mês (mesmo dia)
    let novoVencimento: Date | null = null;
    if (item.vencimento) {
      const dia = new Date(item.vencimento).getDate();
      const ultimoDia = new Date(proxAno, proxMes, 0).getDate();
      novoVencimento = new Date(proxAno, proxMes - 1, Math.min(dia, ultimoDia), 12, 0, 0);
    }

    await prisma.lancamento.create({
      data: {
        tenantId: sessao.tenantId,
        tipo: item.tipo,
        categoria: item.categoria,
        descricao: item.descricao,
        valor: item.valor,
        vencimento: novoVencimento,
        pago: false,
        pagoEm: null,
        recorrencia: item.recorrencia,
        formaPagamento: item.formaPagamento,
      },
    });
    criados++;
  }

  return NextResponse.json({ criados, ignorados });
}
