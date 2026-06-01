import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const incluirInativas = req.nextUrl.searchParams.get("incluirInativas") === "true";

  const formas = await prisma.formaPagamento.findMany({
    where: { tenantId: sessao.tenantId, ...(incluirInativas ? {} : { ativa: true }) },
    orderBy: { ordem: "asc" },
  });

  return NextResponse.json(formas);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin) return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  const body = await req.json();

  const ultima = await prisma.formaPagamento.findFirst({
    where: { tenantId: sessao.tenantId },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });

  const forma = await prisma.formaPagamento.create({
    data: {
      tenantId: sessao.tenantId,
      nome: body.nome || "Nova forma",
      percentualTaxa: Number(body.percentualTaxa ?? 0),
      ordem: (ultima?.ordem ?? -1) + 1,
    },
  });

  return NextResponse.json(forma, { status: 201 });
}
