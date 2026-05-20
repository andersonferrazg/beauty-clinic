import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin) {
    return NextResponse.json({ erro: "Apenas administradores podem fazer backup" }, { status: 403 });
  }

  const [clientes, profissionais, servicos, produtos, agendamentos, lancamentos, comissoes] =
    await Promise.all([
      prisma.cliente.findMany({
        where: { tenantId: sessao.tenantId, ativo: true },
        select: {
          nome: true, telefone1: true, telefone2: true, email: true,
          cpf: true, rg: true, sexo: true, dataNascimento: true,
          endereco: true, observacao: true, criadoEm: true,
        },
      }),
      prisma.profissional.findMany({
        where: { tenantId: sessao.tenantId, ativo: true },
        select: { nome: true, email: true, telefone: true, especialidade: true, tipoComissao: true, percentualComissao: true },
      }),
      prisma.servico.findMany({
        where: { tenantId: sessao.tenantId, ativo: true },
        select: { nome: true, categoria: true, duracaoMin: true, preco: true },
      }),
      prisma.produto.findMany({
        where: { tenantId: sessao.tenantId, ativo: true },
        select: { nome: true, categoria: true, qtdEstoque: true, precoVenda: true, precoCusto: true, dataValidade: true },
      }),
      prisma.agendamento.findMany({
        where: { tenantId: sessao.tenantId },
        select: {
          inicio: true, fim: true, observacao: true, valorTotal: true, formaPagamento: true,
          cliente: { select: { nome: true } },
          profissional: { select: { nome: true } },
          status: { select: { nome: true } },
          itens: { select: { preco: true, servico: { select: { nome: true } } } },
        },
        orderBy: { inicio: "desc" },
        take: 5000,
      }),
      prisma.lancamento.findMany({
        where: { tenantId: sessao.tenantId },
        select: { tipo: true, categoria: true, descricao: true, valor: true, vencimento: true, pagoEm: true, pago: true, criadoEm: true },
        orderBy: { criadoEm: "desc" },
        take: 5000,
      }),
      prisma.comissaoLancamento.findMany({
        where: { tenantId: sessao.tenantId },
        select: {
          valorBase: true, percentual: true, valorComissao: true, pago: true, pagoEm: true, criadoEm: true,
          profissional: { select: { nome: true } },
        },
        orderBy: { criadoEm: "desc" },
        take: 5000,
      }),
    ]);

  const backup = {
    geradoEm: new Date().toISOString(),
    versao: "1.0",
    clientes,
    profissionais,
    servicos,
    produtos,
    agendamentos: agendamentos.map((ag) => ({
      inicio: ag.inicio,
      fim: ag.fim,
      cliente: ag.cliente?.nome ?? null,
      profissional: ag.profissional.nome,
      status: ag.status?.nome ?? null,
      valorTotal: ag.valorTotal,
      formaPagamento: ag.formaPagamento,
      servicos: ag.itens.map((i) => ({ nome: i.servico?.nome ?? null, preco: i.preco })),
      observacao: ag.observacao,
    })),
    lancamentos,
    comissoes: comissoes.map((c) => ({
      profissional: c.profissional.nome,
      valorBase: c.valorBase,
      percentual: c.percentual,
      valorComissao: c.valorComissao,
      pago: c.pago,
      pagoEm: c.pagoEm,
      criadoEm: c.criadoEm,
    })),
  };

  const json = JSON.stringify(backup, null, 2);
  const dataHoje = new Date().toISOString().slice(0, 10);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="backup-beauty-clinic-${dataHoje}.json"`,
    },
  });
}
