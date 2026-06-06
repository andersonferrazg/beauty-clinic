import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin && !sessao.permissoes.movimentarEstoque) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes"); // YYYY-MM

  let dataInicio: Date | undefined;
  let dataFim: Date | undefined;
  if (mes) {
    const [ano, m] = mes.split("-").map(Number);
    dataInicio = new Date(ano, m - 1, 1);
    dataFim = new Date(ano, m, 0, 23, 59, 59);
  }

  const vendas = await prisma.vendaAvulsa.findMany({
    where: {
      tenantId: sessao.tenantId,
      ...(dataInicio && dataFim ? { dataVenda: { gte: dataInicio, lte: dataFim } } : {}),
    },
    include: {
      cliente: { select: { id: true, nome: true } },
      itens: {
        include: { produto: { select: { id: true, nome: true, unidadeMedida: true } } },
      },
    },
    orderBy: { dataVenda: "desc" },
  });

  return NextResponse.json(vendas);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin && !sessao.permissoes.movimentarEstoque) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const {
    clienteId,
    descricao,
    dataVenda,
    formaPagamento,
    itens,
    desconto,
  } = body as {
    clienteId?: string;
    descricao?: string;
    dataVenda: string;
    formaPagamento?: string;
    itens: { produtoId: string; quantidade: number; precoUnitario: number }[];
    desconto?: number;
  };

  if (!dataVenda || !itens?.length) {
    return NextResponse.json({ erro: "Data e pelo menos 1 item são obrigatórios" }, { status: 400 });
  }

  const valorTotal = itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
  const descontoVal = desconto ?? 0;
  const totalLiquido = Math.max(0, Math.round((valorTotal - descontoVal) * 100) / 100);

  const venda = await prisma.$transaction(async (tx) => {
    // Cria a venda
    const v = await tx.vendaAvulsa.create({
      data: {
        tenantId: sessao.tenantId,
        clienteId: clienteId || null,
        descricao: descricao || null,
        dataVenda: new Date(dataVenda),
        formaPagamento: formaPagamento || null,
        valorTotal,
        desconto: descontoVal,
        totalLiquido,
        itens: {
          create: itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            precoUnitario: i.precoUnitario,
          })),
        },
      },
      include: { itens: true, cliente: { select: { nome: true } } },
    });

    // Lançamento de receita
    const cliNome = v.cliente?.nome ?? "Cliente avulso";
    const lancamento = await tx.lancamento.create({
      data: {
        tenantId: sessao.tenantId,
        tipo: "RECEITA",
        categoria: "Venda Avulsa",
        descricao: descricao ? `${cliNome} — ${descricao}` : `Venda avulsa — ${cliNome}`,
        valor: totalLiquido,
        pago: true,
        pagoEm: new Date(),
        vencimento: new Date(dataVenda),
        formaPagamento: formaPagamento ?? null,
        origem: "AUTO_ATENDIMENTO",
      },
    });

    // Vincula lancamento à venda
    await tx.vendaAvulsa.update({
      where: { id: v.id },
      data: { lancamentoId: lancamento.id },
    });

    // Baixa de estoque para cada item
    for (const item of itens) {
      await tx.movimentacaoEstoque.create({
        data: {
          tenantId: sessao.tenantId,
          produtoId: item.produtoId,
          tipo: "SAIDA",
          quantidade: item.quantidade,
          motivo: `Venda avulsa #${v.id.slice(-6)}${descricao ? ` — ${descricao}` : ""}`,
        },
      });
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { qtdEstoque: { decrement: item.quantidade } },
      });
    }

    return v;
  });

  return NextResponse.json(venda, { status: 201 });
}
