import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();

  const status = await prisma.statusAgenda.findMany({
    where: { tenantId: sessao.tenantId },
    orderBy: { ordem: "asc" },
  });

  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const body = await req.json();

  const ultimo = await prisma.statusAgenda.findFirst({
    where: { tenantId: sessao.tenantId },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });

  const status = await prisma.statusAgenda.create({
    data: {
      tenantId: sessao.tenantId,
      nome: body.nome || "Novo status",
      cor: body.cor || "#94a3b8",
      contaConfirmado: body.contaConfirmado ?? false,
      ordem: (ultimo?.ordem ?? -1) + 1,
      sistemico: false,
    },
  });

  return NextResponse.json(status, { status: 201 });
}
