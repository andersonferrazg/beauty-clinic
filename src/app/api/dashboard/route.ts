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
  let comissoesPendentes = null;
  let contasVencendo: object[] = [];
  let aniversariantesMes: object[] = [];
  let faturamentoPorProfissional: object[] = [];

  if (isAdmin) {
    const lancamentos = await prisma.lancamento.findMany({
      where: { tenantId, criadoEm: { gte: inicioMes, lt: fimMes } },
      select: { tipo: true, valor: true, pago: true, origem: true },
    });

    const receita = lancamentos.filter((l) => l.tipo === "RECEITA").reduce((s, l) => s + l.valor, 0);
    const despesa = lancamentos.filter((l) => l.tipo === "DESPESA").reduce((s, l) => s + l.valor, 0);
    resumoMes = { receita, despesa, lucro: receita - despesa };

    // Comissões pendentes (a pagar/receber) no mês
    const pendentes = await prisma.comissaoLancamento.aggregate({
      where: { tenantId, pago: false, criadoEm: { gte: inicioMes, lt: fimMes } },
      _sum: { valorComissao: true },
      _count: true,
    });
    comissoesPendentes = {
      total: pendentes._sum.valorComissao ?? 0,
      count: pendentes._count,
    };

    // Contas vencendo nos próximos 7 dias (não pagas)
    contasVencendo = await prisma.lancamento.findMany({
      where: {
        tenantId,
        pago: false,
        vencimento: { gte: hoje, lt: em7dias },
      },
      select: { id: true, descricao: true, valor: true, vencimento: true, categoria: true, tipo: true },
      orderBy: { vencimento: "asc" },
      take: 10,
    });

    // Aniversariantes do mês (filtragem por mês em JS — SQLite não tem funções de data nativas)
    const clientes = await prisma.cliente.findMany({
      where: { tenantId, ativo: true, dataNascimento: { not: null } },
      select: { id: true, nome: true, dataNascimento: true, telefone1: true },
    });
    const mesHoje = hoje.getMonth();
    aniversariantesMes = clientes
      .filter((c) => c.dataNascimento && new Date(c.dataNascimento).getMonth() === mesHoje)
      .sort((a, b) => {
        const dA = new Date(a.dataNascimento!).getDate();
        const dB = new Date(b.dataNascimento!).getDate();
        return dA - dB;
      })
      .slice(0, 10);

    // Faturamento por profissional no mês (via ComissaoLancamento que registra o valorBase)
    const profissionais = await prisma.profissional.findMany({
      where: { tenantId, ativo: true },
      select: { id: true, nome: true, cor: true },
    });

    const comissoesMes = await prisma.comissaoLancamento.findMany({
      where: { tenantId, criadoEm: { gte: inicioMes, lt: fimMes } },
      select: { profissionalId: true, valorBase: true },
    });

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
    comissoesPendentes,
    contasVencendo,
    aniversariantesMes,
    faturamentoPorProfissional,
    comissaoMesProfissional,
    atendimentosMes,
  });
}
