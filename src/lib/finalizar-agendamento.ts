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
      itens: {
        include: {
          servico: true,
          produto: { select: { id: true, nome: true, comissaoPercentual: true } },
        },
      },
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
      pagamentos: true,
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
    produto: { id: string; nome: string; comissaoPercentual: number | null } | null;
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
  pagamentos: Array<{ id: string; formaPagamento: string; valor: number; parcelas: number }>;
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

  // Retorno: não gera receita nem comissão (paciente não paga), mas baixa estoque normalmente.
  const isRetorno = agendamento.formaPagamento === "Retorno";

  const valorBruto = agendamento.itens.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0,
  );

  // Calcula taxa: se houver splits, calcula por split; caso contrário, usa forma única
  let taxaValor = 0;
  let valorLiquido = valorBruto;
  let taxaPercentual = 0; // percentual médio ponderado (para Lancamento.percentualTaxa)
  let formaLancamento: string | null = agendamento.formaPagamento ?? null;

  async function calcTaxaSplit(forma: string, valor: number, parcs: number): Promise<number> {
    const formaPgto = await prisma.formaPagamento.findFirst({
      where: { tenantId, nome: forma, ativa: true },
      select: { percentualTaxa: true, configJson: true },
    });
    if (!formaPgto) return 0;
    let pct = 0;
    if (forma === "Cartão de Crédito") {
      const configJson = agendamento.profissional.configJsonCartao ?? formaPgto.configJson;
      if (configJson) { try { pct = taxaParaParcelas(parsearConfigCartao(configJson), parcs); } catch {} }
    } else if (forma === "Cartão de Débito") {
      let propria: number | null = null;
      if (agendamento.profissional.configJsonCartao) {
        try { const c = JSON.parse(agendamento.profissional.configJsonCartao); if (typeof c.taxaDebito === "number") propria = c.taxaDebito; } catch {}
      }
      pct = propria !== null ? propria : formaPgto.percentualTaxa;
    } else if (forma === "Link de Pagamento") {
      let taxaResolvida: number | null = null;
      if (agendamento.profissional.configJsonCartao) {
        try {
          const c = JSON.parse(agendamento.profissional.configJsonCartao);
          if (Array.isArray(c.taxasLink) && c.taxasLink.length > 0 && parcs > 1) {
            taxaResolvida = taxaParaParcelas({ maxParcelas: c.maxParcelasLink ?? 12, taxas: c.taxasLink }, parcs);
          } else if (typeof c.taxaLink === "number") { taxaResolvida = c.taxaLink; }
        } catch {}
      }
      if (taxaResolvida === null) {
        if (formaPgto.configJson && parcs > 1) {
          taxaResolvida = taxaParaParcelas(parsearConfigCartao(formaPgto.configJson), parcs);
        } else { taxaResolvida = formaPgto.percentualTaxa; }
      }
      pct = taxaResolvida;
    } else { pct = formaPgto.percentualTaxa; }
    return pct > 0 ? Math.round(valor * (pct / 100) * 100) / 100 : 0;
  }

  if (!isRetorno) {
    const splits = agendamento.pagamentos?.length ? agendamento.pagamentos : null;
    if (splits && splits.length > 0) {
      // Multi-pagamento: taxa por split
      let totalTaxa = 0;
      for (const split of splits) {
        totalTaxa += await calcTaxaSplit(split.formaPagamento, split.valor, split.parcelas);
      }
      taxaValor = Math.round(totalTaxa * 100) / 100;
      valorLiquido = Math.round((valorBruto - taxaValor) * 100) / 100;
      taxaPercentual = valorBruto > 0 ? Math.round((taxaValor / valorBruto) * 10000) / 100 : 0;
      formaLancamento = splits.length > 1 ? "Misto" : splits[0].formaPagamento;
    } else if (agendamento.formaPagamento) {
      // Pagamento único: comportamento original
      taxaValor = await calcTaxaSplit(agendamento.formaPagamento, valorBruto, agendamento.parcelas ?? 1);
      if (taxaValor > 0) {
        valorLiquido = Math.round((valorBruto - taxaValor) * 100) / 100;
        taxaPercentual = Math.round((taxaValor / valorBruto) * 10000) / 100;
      }
    }
  }

  const isColaboradoraPaga = agendamento.profissional.direcaoComissao === "COLABORADORA_PAGA";

  await prisma.$transaction(async (tx) => {
    let lancamentoId: string | null = null;

    if (!isRetorno && valorBruto > 0) {
      // CLINICA_PAGA: clínica recebe o dinheiro diretamente → cria Lancamento RECEITA
      if (!isColaboradoraPaga) {
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
            vencimento: agendamento.inicio,
            formaPagamento: formaLancamento,
            origem: "AUTO_ATENDIMENTO",
          },
        });
        lancamentoId = lancamento.id;
      }
      // COLABORADORA_PAGA: profissional recebe da cliente e paga taxa à clínica
      // → sem Lancamento agora; Lancamento RECEITA é criado só ao receber o repasse em /comissoes/pagar

      // Comissão: calculada para ambos os modelos (CLINICA_PAGA e COLABORADORA_PAGA)
      const prof = agendamento.profissional;
      const liquidFactor = valorBruto > 0 && prof.comissaoSobre === "LIQUIDO"
        ? valorLiquido / valorBruto
        : 1;
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
        const temTaxaEspecifica = agendamento.itens.some(
          (it) => it.produto?.comissaoPercentual != null,
        );
        if (temTaxaEspecifica) {
          let soma = 0;
          for (const item of agendamento.itens) {
            const taxa = item.produto?.comissaoPercentual ?? prof.percentualComissao ?? 0;
            soma += item.preco * item.quantidade * (taxa / 100) * liquidFactor;
          }
          valorComissao = Math.round(soma * 100) / 100;
          percentualUsado = null;
        } else {
          valorComissao = baseComissao * (prof.percentualComissao / 100);
          percentualUsado = prof.percentualComissao;
        }
      }
      // SALARIO_FIXO não gera comissão por atendimento

      if (valorComissao > 0) {
        await tx.comissaoLancamento.create({
          data: {
            tenantId,
            lancamentoId: lancamentoId ?? undefined,
            agendamentoId: agendamento.id,
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
  // Verifica comissões pagas tanto por lancamentoId (CLINICA_PAGA) quanto por agendamentoId (COLABORADORA_PAGA)
  const comissoesPagas = await prisma.comissaoLancamento.count({
    where: agendamento.lancamentoId
      ? { tenantId, pago: true, OR: [{ lancamentoId: agendamento.lancamentoId }, { agendamentoId: agendamento.id }] }
      : { tenantId, pago: true, agendamentoId: agendamento.id },
  });
  if (comissoesPagas > 0) {
    throw new Error(
      "Não é possível reverter: existem comissões já pagas para este atendimento.",
    );
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

    // CLINICA_PAGA: remove comissões pelo lancamentoId e depois o próprio lancamento
    if (lancId) {
      await tx.comissaoLancamento.deleteMany({ where: { lancamentoId: lancId } });
      await tx.lancamento.delete({ where: { id: lancId } });
    }

    // COLABORADORA_PAGA: remove comissões pelo agendamentoId (sem lancamentoId)
    await tx.comissaoLancamento.deleteMany({
      where: { agendamentoId: agendamento.id, lancamentoId: null, tenantId },
    });
  });
}
