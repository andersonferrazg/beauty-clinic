import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();
  const { tenantId, profissionalId, nome } = sessao;
  const isAdmin = sessao.permissoes.isAdmin;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
  const em7dias = new Date(hoje); em7dias.setDate(em7dias.getDate() + 8);

  const anoMes = hoje.getFullYear();
  const mesAtual = hoje.getMonth();
  const inicioMes = new Date(anoMes, mesAtual, 1);
  const fimMes = new Date(anoMes, mesAtual + 1, 1);

  // ─── Agendamentos de hoje ───────────────────────────────────────────────────
  const agendamentosHoje = await prisma.agendamento.findMany({
    where: {
      tenantId,
      inicio: { gte: hoje, lt: amanha },
      ...(isAdmin ? {} : { profissionalId: profissionalId ?? undefined }),
    },
    include: {
      cliente: { select: { id: true, nome: true } },
      profissional: { select: { id: true, nome: true, cor: true } },
      status: { select: { nome: true, cor: true, contaConfirmado: true } },
      itens: { include: { servico: { select: { nome: true } } }, take: 1 },
    },
    orderBy: { inicio: "asc" },
  });

  // ─── Admin: resumo financeiro do mês ───────────────────────────────────────
  let resumoMes = null;
  let gastosClinicaMes = 0;
  let gastosPessoalMes = 0;
  let comissoesPendentes = null;
  let contasVencendo: object[] = [];
  let aniversariantesMes: object[] = [];
  let faturamentoPorProfissional: object[] = [];

  if (isAdmin) {
    const mesHoje = hoje.getMonth();
    const isPostgres = process.env.DATABASE_PROVIDER === "postgresql";

    // Aniversariantes — usa SQL nativo em Postgres (rápido); cai pra JS em SQLite local
    const aniversariantesPromise: Promise<{ id: string; nome: string; dataNascimento: Date | null; telefone1: string | null }[]> = isPostgres
      ? prisma.$queryRaw`
          SELECT id, nome, "dataNascimento", telefone1
          FROM clientes
          WHERE "tenantId" = ${tenantId}
            AND ativo = true
            AND "dataNascimento" IS NOT NULL
            AND EXTRACT(MONTH FROM "dataNascimento") = ${mesHoje + 1}
          ORDER BY EXTRACT(DAY FROM "dataNascimento") ASC
          LIMIT 10
        `
      : prisma.cliente
          .findMany({
            where: { tenantId, ativo: true, dataNascimento: { not: null } },
            select: { id: true, nome: true, dataNascimento: true, telefone1: true },
          })
          .then((clientes) =>
            clientes
              .filter((c) => c.dataNascimento && new Date(c.dataNascimento).getMonth() === mesHoje)
              .sort((a, b) => new Date(a.dataNascimento!).getDate() - new Date(b.dataNascimento!).getDate())
              .slice(0, 10),
          );

    // Todas as queries em paralelo — tempos se sobrepõem em vez de somar
    const [
      lancamentos,
      pendentes,
      contasVencendoRes,
      aniversariantesRes,
      profissionais,
      comissoesMes,
      gastosClinicaAgg,
      gastosCasaAgg,
    ] = await Promise.all([
      prisma.lancamento.findMany({
        where: {
          tenantId,
          criadoEm: { gte: inicioMes, lt: fimMes },
          categoria: { notIn: ["Gastos Clínica", "Gastos Casa"] },
        },
        select: { tipo: true, valor: true, pago: true, origem: true },
      }),
      prisma.comissaoLancamento.aggregate({
        where: { tenantId, pago: false, criadoEm: { gte: inicioMes, lt: fimMes } },
        _sum: { valorComissao: true },
        _count: true,
      }),
      prisma.lancamento.findMany({
        where: { tenantId, pago: false, vencimento: { gte: hoje, lt: em7dias } },
        select: { id: true, descricao: true, valor: true, vencimento: true, categoria: true, tipo: true },
        orderBy: { vencimento: "asc" },
        take: 10,
      }),
      aniversariantesPromise,
      prisma.profissional.findMany({
        where: { tenantId, ativo: true },
        select: { id: true, nome: true, cor: true },
      }),
      prisma.comissaoLancamento.findMany({
        where: { tenantId, criadoEm: { gte: inicioMes, lt: fimMes } },
        select: { profissionalId: true, valorBase: true },
      }),
      prisma.lancamento.aggregate({
        where: { tenantId, categoria: "Gastos Clínica", vencimento: { gte: inicioMes, lt: fimMes } },
        _sum: { valor: true },
      }),
      prisma.lancamento.aggregate({
        where: { tenantId, categoria: "Gastos Casa", vencimento: { gte: inicioMes, lt: fimMes } },
        _sum: { valor: true },
      }),
    ]);

    const receita = lancamentos.filter((l) => l.tipo === "RECEITA").reduce((s, l) => s + l.valor, 0);
    const despesa = lancamentos.filter((l) => l.tipo === "DESPESA").reduce((s, l) => s + l.valor, 0);
    resumoMes = { receita, despesa, lucro: receita - despesa };

    gastosClinicaMes = gastosClinicaAgg._sum.valor ?? 0;
    gastosPessoalMes = gastosCasaAgg._sum.valor ?? 0;

    comissoesPendentes = {
      total: pendentes._sum.valorComissao ?? 0,
      count: pendentes._count,
    };

    contasVencendo = contasVencendoRes;
    aniversariantesMes = aniversariantesRes;

    // Soma valorBase por profissional (valorBase = receita do atendimento)
    const receitaMap: Record<string, number> = {};
    for (const c of comissoesMes) {
      receitaMap[c.profissionalId] = (receitaMap[c.profissionalId] ?? 0) + c.valorBase;
    }

    faturamentoPorProfissional = profissionais
      .map((p) => ({ profissionalId: p.id, nome: p.nome, cor: p.cor, receita: receitaMap[p.id] ?? 0 }))
      .filter((p) => p.receita > 0)
      .sort((a, b) => b.receita - a.receita);
  }

  // ─── Profissional: comissão e atendimentos do mês ──────────────────────────
  let comissaoMesProfissional = null;
  let atendimentosMes = null;

  if (!isAdmin && profissionalId) {
    const comissoes = await prisma.comissaoLancamento.findMany({
      where: { tenantId, profissionalId, criadoEm: { gte: inicioMes, lt: fimMes } },
      select: { valorComissao: true, pago: true },
    });
    const totalComissao = comissoes.reduce((s, c) => s + c.valorComissao, 0);
    const pendenteComissao = comissoes.filter((c) => !c.pago).reduce((s, c) => s + c.valorComissao, 0);
    comissaoMesProfissional = { total: totalComissao, pendente: pendenteComissao };

    atendimentosMes = await prisma.agendamento.count({
      where: {
        tenantId,
        profissionalId,
        inicio: { gte: inicioMes, lt: fimMes },
        dataRealizado: { not: null },
      },
    });
  }

  return NextResponse.json({
    isAdmin,
    nomeUsuario: nome,
    agendamentosHoje,
    resumoMes,
    gastosClinicaMes,
    gastosPessoalMes,
    comissoesPendentes,
    contasVencendo,
    aniversariantesMes,
    faturamentoPorProfissional,
    comissaoMesProfissional,
    atendimentosMes,
  });
}
