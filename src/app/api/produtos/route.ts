import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const busca = req.nextUrl.searchParams.get("q") ?? "";

  const produtos = await prisma.produto.findMany({
    where: {
      tenantId: sessao.tenantId,
      ativo: true,
      ...(busca ? { nome: { contains: busca } } : {}),
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(produtos);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const body = await req.json();

  const produto = await prisma.produto.create({
    data: {
      tenantId: sessao.tenantId,
      nome: body.nome,
      categoria: body.categoria ?? null,
      precoVenda: body.precoVenda ? Number(body.precoVenda) : 0,
      precoCusto: body.precoCusto ? Number(body.precoCusto) : null,
      qtdEstoque: body.qtdEstoque ? Number(body.qtdEstoque) : 0,
      qtdMinima: body.qtdMinima ? Number(body.qtdMinima) : 0,
      patrimonio: body.patrimonio ?? false,
      dataValidade: body.dataValidade ? new Date(body.dataValidade) : null,
    },
  });

  return NextResponse.json(produto, { status: 201 });
}
