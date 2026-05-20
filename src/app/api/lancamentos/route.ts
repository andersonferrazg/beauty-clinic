import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, temPermissao } from "@/lib/session";
import { processarRecorrenciasMensais } from "@/lib/recorrencia-financeira";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const tipo = req.nextUrl.searchParams.get("tipo"); // RECEITA | DESPESA
  const mes = req.nextUrl.searchParams.get("mes");   // YYYY-MM

  // Gera recorrências automáticas (idempotente — só cria o que falta)
  try {
    await processarRecorrenciasMensais(sessao.tenantId);
  } catch (e) {
    console.error("Erro ao processar recorrências:", e);
  }

  let dataInicio: Date | undefined;
  let dataFim: Date | undefined;

  if (mes) {
    const [ano, m] = mes.split("-").map(Number);
    dataInicio = new Date(ano, m - 1, 1);
    dataFim = new Date(ano, m, 0, 23, 59, 59);
  }

  // Não-admin: vê apenas os lançamentos gerados pelos próprios agendamentos
  const ehAdmin = temPermissao(sessao, "isAdmin");
  const filtroProfissional =
    !ehAdmin && sessao.profissionalId
      ? { agendamento: { profissionalId: sessao.profissionalId } }
      : {};

  const lancamentos = await prisma.lancamento.findMany({
    where: {
      tenantId: sessao.tenantId,
      ...(tipo ? { tipo } : {}),
      ...(dataInicio && dataFim
        ? {
            OR: [
              { vencimento: { gte: dataInicio, lte: dataFim } },
              { AND: [{ vencimento: null }, { criadoEm: { gte: dataInicio, lte: dataFim } }] },
            ],
          }
        : {}),
      ...filtroProfissional,
    },
    orderBy: [{ vencimento: "asc" }, { criadoEm: "desc" }],
    take: 200,
  });

  return NextResponse.json(lancamentos);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const body = await req.json();

  const lancamento = await prisma.lancamento.create({
    data: {
      tenantId: sessao.tenantId,
      tipo: body.tipo,
      categoria: body.categoria ?? null,
      descricao: body.descricao,
      valor: Number(body.valor),
      vencimento: body.vencimento ? new Date(body.vencimento) : null,
      pagoEm: body.pagoEm ? new Date(body.pagoEm) : null,
      pago: body.pago ?? false,
      recorrencia: body.recorrencia ?? null,
      formaPagamento: body.formaPagamento ?? null,
    },
  });

  return NextResponse.json(lancamento, { status: 201 });
}
