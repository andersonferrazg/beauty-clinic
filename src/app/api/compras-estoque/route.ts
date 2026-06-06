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

  const compras = await prisma.compraEstoque.findMany({
    where: {
      tenantId: sessao.tenantId,
      ...(dataInicio && dataFim ? { dataCompra: { gte: dataInicio, lte: dataFim } } : {}),
    },
    include: {
      fornecedor: { select: { id: true, nome: true } },
      itens: {
        include: { produto: { select: { id: true, nome: true, unidadeMedida: true } } },
      },
    },
    orderBy: { dataCompra: "desc" },
  });

  return NextResponse.json(compras);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin && !sessao.permissoes.movimentarEstoque) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const {
    fornecedorId,
    descricao,
    dataCompra,
    dataPagamento,
    formaPagamento,
    itens,
    desconto,
  } = body as {
    fornecedorId?: string;
    descricao?: string;
    dataCompra: string;
    dataPagamento?: string;
    formaPagamento?: string;
    itens: { produtoId: string; quantidade: number; custoUnitario: number }[];
    desconto?: number;
  };

  if (!dataCompra || !itens?.length) {
    return NextResponse.json({ erro: "Data e pelo menos 1 item são obrigatórios" }, { status: 400 });
  }

  const valorTotal = itens.reduce((s, i) => s + i.quantidade * i.custoUnitario, 0);
  const descontoVal = desconto ?? 0;
  const totalLiquido = Math.max(0, Math.round((valorTotal - descontoVal) * 100) / 100);

  const compra = await prisma.$transaction(async (tx) => {
    const c = await tx.compraEstoque.create({
      data: {
        tenantId: sessao.tenantId,
        fornecedorId: fornecedorId || null,
        descricao: descricao || null,
        dataCompra: new Date(dataCompra),
        dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
        formaPagamento: formaPagamento || null,
        valorTotal,
        desconto: descontoVal,
        totalLiquido,
        itens: {
          create: itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            custoUnitario: i.custoUnitario,
          })),
        },
      },
      include: { itens: true },
    });

    // Entrada no estoque para cada item
    for (const item of itens) {
      await tx.movimentacaoEstoque.create({
        data: {
          tenantId: sessao.tenantId,
          produtoId: item.produtoId,
          tipo: "ENTRADA",
          quantidade: item.quantidade,
          custoUnitario: item.custoUnitario,
          motivo: `Compra #${c.id.slice(-6)}${descricao ? ` — ${descricao}` : ""}`,
        },
      });
      await tx.produto.update({
        where: { id: item.produtoId },
        data: {
          qtdEstoque: { increment: item.quantidade },
          precoCusto: item.custoUnitario,
        },
      });
    }

    return c;
  });

  return NextResponse.json(compra, { status: 201 });
}
