import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const busca = req.nextUrl.searchParams.get("q") ?? "";

  const servicos = await prisma.servico.findMany({
    where: {
      tenantId: sessao.tenantId,
      ativo: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(busca ? { nome: { contains: busca, mode: "insensitive" } as any } : {}),
    },
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      categoria: true,
      cor: true,
      duracaoMin: true,
      preco: true,
      precoVariavel: true,
    },
  });

  return NextResponse.json(servicos);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const body = await req.json();

  const servico = await prisma.servico.create({
    data: {
      tenantId: sessao.tenantId,
      nome: body.nome,
      categoria: body.categoria ?? null,
      cor: body.cor ?? "#B89968",
      duracaoMin: body.duracaoMin ?? 60,
      preco: body.preco ?? 0,
      precoVariavel: body.precoVariavel ?? false,
    },
  });

  return NextResponse.json(servico, { status: 201 });
}
