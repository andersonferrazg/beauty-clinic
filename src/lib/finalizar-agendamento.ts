import { prisma } from "@/lib/prisma";
import { parsearConfigCartao, taxaParaParcelas } from "@/lib/pagamentoCredito";

/**
 * Processa mudança de status de um agendamento.
 * - Se o novo status tem contaConfirmado=true e ainda não foi processado:
 *   cria Lancamento RECEITA, calcula ComissaoLancamento e baixa estoque.
 * - Se sai de um status confirmado para um não-confirmado:
 *   reverte todas as operações (lancamento, comissões, estoque).
 *
 * Lança Error se a reversão não for possível (ex: comissão já paga).
 */
export async function processarStatusAgendamento(
  agendamentoId: string,
  tenantId: string,
  novoStatusId: string | null | undefined,
) {
  const agendamento = await prisma.agendamento.findFirst({
    where: { id: agendamentoId, tenantId },
    include: {
      itens: { include: { servico: true, produto: true } },
      profissional: {
      select: {
        id: true,
        nome: true,
        tipoComissao: true,
        percentualComissao: true,
        salarioFixo: true,
        direcaoComissao: true,
        profissionalTerceiro: true,
        comissaoSobre: true,
        configJsonCartao: true,
      },
    },
      cliente: { select: { id: true, nome: true } },
    },
  });

  if (!agendamento) return;

  let novoStatus = null;
  if (novoStatusId) {
    novoStatus = await prisma.statusAgenda.findFirst({
      where: { id: novoStatusId, tenantId },
    });
  }

  const ehFinalizado = !!novoStatus?.contaConfirmado;
  const jaEstavaFinalizado = !!agendamento.dataRealizado;

  if (ehFinalizado && !jaEstavaFinalizado) {
    await finalizar(agendamento, tenantId);
  } else if (!ehFinalizado && jaEstavaFinalizado) {
    await reverter(agendamento, tenantId);
  }
}

type AgendamentoComItens = Awaited<ReturnType<typeof prisma.agendamento.findFirst>> & {
  itens: Array<{
    id: string;
    servicoId: string | null;
    produtoId: string | null;
    preco: number;
    quantidade: number;
    servico: { id: string; nome: string; produtoConsumidoId: string | null; qtdConsumida: number | null } | null;
    produto: { id: string; nome: string } | null;
  }>;
  profissional: {
    id: string;
    nome: string;
    tipoComissao: string;
    percentualComissao: number | null;
    salarioFixo: number | null;
    direcaoComissao: string;
    profissionalTerceiro: boolean;
    comissaoSobre: string;
    configJsonCartao: string | null;
  };
  cliente: { id: string; nome: string } | null;
  lancamentoId: string | null;
};

async function finalizar(agendamento: AgendamentoComItens, tenantId: string) {
  // Profissional terceiro: atendimento não entra no financeiro da clínica.
  if (agendamento.profissional.profissionalTerceiro) {
    await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { dataRealizado: new Date() },
    });
    return;
  }

  const valorBruto = agendamento.itens.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0,
  );

  // Buscar taxa da forma de pagamento (se houver)
  let taxaPercentual = 0;
  let taxaValor = 0;
  let valorLiquido = valorBruto;

  if (agendamento.formaPagamento) {
    const formaPgto = await prisma.formaPagamento.findFirst({
      where: { tenantId, nome: agendamento.formaPagamento, ativa: true },
      select: { percentualTaxa: true, configJson: true },
    });
    if (formaPgto) {
      // Cartão de Crédito: config própria da profissional tem prioridade sobre a global
      if (agendamento.formaPagamento === "Cartão de Crédito") {
        const configJson = agendamento.profissional.configJsonCartao ?? formaPgto.configJson;
        if (configJson) {
          const config = parsearConfigCartao(configJson);
          taxaPercentual = taxaParaParcelas(config, agendamento.parcelas ?? 1);
        }
      } else if (formaPgto.percentualTaxa > 0) {
        taxaPercentual = formaPgto.percentualTaxa;
      }
      if (taxaPercentual > 0) {
        taxaValor = Math.round(valorBruto * (taxaPercentual / 100) * 100) / 100;
        valorLiquido = Math.round((valorBruto - taxaValor) * 100) / 100;
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    let lancamentoId: string | null = null;

    if (valorBruto > 0) {
      const profNome = agendamento.profissional.nome;
      const cliNome = agendamento.cliente?.nome ?? "Atendimento avulso";
      const descricao = `${cliNome} — ${profNome}`;

      const lancamento = await tx.lancamento.create({
        data: {
          tenantId,
          tipo: "RECEITA",
          categoria: "Atendimento",
          descricao,
          valor: valorLiquido,
          valorBruto: taxaValor > 0 ? valorBruto : null,
          taxa: taxaValor > 0 ? taxaValor : null,
          percentualTaxa: taxaValor > 0 ? taxaPercentual : null,
          pago: true,
          pagoEm: new Date(),
          formaPagamento: agendamento.formaPagamento ?? null,
          origem: "AUTO_ATENDIMENTO",
        },
      });
      lancamentoId = lancamento.id;

      // Base para comissão: bruto ou líquido conforme configuração da profissional
      const prof = agendamento.profissional;
      const baseComissao = prof.comissaoSobre === "LIQUIDO" ? valorLiquido : valorBruto;

      let valorComissao = 0;
      let percentualUsado: number | null = null;

      if (prof.tipoComissao === "INTEGRAL") {
        valorComissao = baseComissao;
        percentualUsado = 100;
      } else if (
        (prof.tipoComissao === "PERCENTUAL" || prof.tipoComissao === "MISTO") &&
        prof.percentualComissao
      ) {
        valorComissao = baseComissao * (prof.percentualComissao / 100);
        percentualUsado = prof.percentualComissao;
      }
      // SALARIO_FIXO não gera comissão por atendimento

      if (valorComissao > 0) {
        await tx.comissaoLancamento.create({
          data: {
            tenantId,
            lancamentoId: lancamento.id,
            profissionalId: prof.id,
            valorBase: baseComissao,
            percentual: percentualUsado,
            direcaoComissao: prof.direcaoComissao ?? "CLINICA_PAGA",
            valorComissao,
          },
        });
      }
    }

    // Atualiza agendamento
    await tx.agendamento.update({
      where: { id: agendamento.id },
      data: {
        dataRealizado: new Date(),
        valorTotal: valorBruto || agendamento.valorTotal,
        ...(lancamentoId ? { lancamentoId } : {}),
      },
    });

    // Baixa de estoque
    for (const item of agendamento.itens) {
      // Produto vendido diretamente
      if (item.produtoId) {
        await tx.movimentacaoEstoque.create({
          data: {
            tenantId,
            produtoId: item.produtoId,
            agendamentoId: agendamento.id,
            tipo: "SAIDA",
            quantidade: item.quantidade,
            motivo: "Venda em atendimento",
          },
        });
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { qtdEstoque: { decrement: item.quantidade } },
        });
      }

      // Serviço com produto consumido (ex.: Botox consome 1 frasco de toxina)
      if (item.servico?.produtoConsumidoId && item.servico.qtdConsumida) {
        const qtd = item.servico.qtdConsumida * item.quantidade;
        await tx.movimentacaoEstoque.create({
          data: {
            tenantId,
            produtoId: item.servico.produtoConsumidoId,
            agendamentoId: agendamento.id,
            tipo: "SAIDA",
            quantidade: qtd,
            motivo: `Consumido em: ${item.servico.nome}`,
          },
        });
        await tx.produto.update({
          where: { id: item.servico.produtoConsumidoId },
          data: { qtdEstoque: { decrement: qtd } },
        });
      }
    }
  });
}

async function reverter(agendamento: AgendamentoComItens, tenantId: string) {
  if (agendamento.lancamentoId) {
    const comissoesPagas = await prisma.comissaoLancamento.count({
      where: { lancamentoId: agendamento.lancamentoId, pago: true },
    });
    if (comissoesPagas > 0) {
      throw new Error(
        "Não é possível reverter: existem comissões já pagas para este atendimento.",
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    // Devolve estoque
    const movs = await tx.movimentacaoEstoque.findMany({
      where: { agendamentoId: agendamento.id, tipo: "SAIDA", tenantId },
    });
    for (const mov of movs) {
      await tx.produto.update({
        where: { id: mov.produtoId },
        data: { qtdEstoque: { increment: mov.quantidade } },
      });
    }
    await tx.movimentacaoEstoque.deleteMany({
      where: { agendamentoId: agendamento.id, tenantId },
    });

    // Desvincula e remove lançamento + comissões
    const lancId = agendamento.lancamentoId;
    await tx.agendamento.update({
      where: { id: agendamento.id },
      data: { dataRealizado: null, lancamentoId: null },
    });

    if (lancId) {
      await tx.comissaoLancamento.deleteMany({ where: { lancamentoId: lancId } });
      await tx.lancamento.delete({ where: { id: lancId } });
    }
  });
}
