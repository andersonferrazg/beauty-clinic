import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const q = req.nextUrl.searchParams.get("q") ?? "";

  const clientes = await prisma.cliente.findMany({
    where: {
      tenantId: sessao.tenantId,
      ativo: true,
      prontuario: { isNot: null },
      ...(q ? { nome: { contains: q } } : {}),
    },
    include: {
      prontuario: {
        include: {
          procedimentos: {
            orderBy: { data: "desc" },
            take: 1,
            select: { data: true, tipo: true },
          },
          _count: { select: { procedimentos: true } },
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const { clienteId } = await req.json();

  const existente = await prisma.prontuario.findUnique({ where: { clienteId } });
  if (existente) return NextResponse.json(existente);

  const prontuario = await prisma.prontuario.create({
    data: { tenantId: sessao.tenantId, clienteId },
  });

  return NextResponse.json(prontuario, { status: 201 });
}
