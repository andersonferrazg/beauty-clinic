import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const ano = parseInt(req.nextUrl.searchParams.get("ano") ?? String(new Date().getFullYear()));

  const inicioAno = new Date(ano, 0, 1);
  const fimAno   = new Date(ano, 11, 31, 23, 59, 59);

  const lancamentos = await prisma.lancamento.findMany({
    where: {
      tenantId: sessao.tenantId,
      categoria: { notIn: ["Gastos Casa"] },
      OR: [
        { vencimento: { gte: inicioAno, lte: fimAno } },
        { AND: [{ vencimento: null }, { criadoEm: { gte: inicioAno, lte: fimAno } }] },
      ],
    },
    select: { tipo: true, valor: true, pago: true, categoria: true, vencimento: true, criadoEm: true },
  });

  const meses = Array.from({ length: 12 }, (_, i) => {
    const ml = lancamentos.filter((l) => {
      const d = l.vencimento ?? l.criadoEm;
      return d.getMonth() === i;
    });
    const receita = ml.filter((l) => l.tipo === "RECEITA" && l.pago).reduce((s, l) => s + l.valor, 0);
    const despesa = ml.filter((l) => l.tipo === "DESPESA" && l.pago && l.categoria !== "Comissões").reduce((s, l) => s + l.valor, 0);
    return { mes: i + 1, receita, despesa };
  });

  return NextResponse.json(meses);
}
