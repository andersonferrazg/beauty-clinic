import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const busca = req.nextUrl.searchParams.get("q") ?? "";
  const todos = req.nextUrl.searchParams.has("todos");

  const clientes = await prisma.cliente.findMany({
    where: {
      tenantId: sessao.tenantId,
      ativo: true,
      ...(busca
        ? {
            OR: [
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { nome: { contains: busca, mode: "insensitive" } as any },
              { telefone1: { contains: busca } },
            ],
          }
        : {}),
    },
    orderBy: { nome: "asc" },
    ...(todos ? {} : { take: 30 }),
    select: {
      id: true,
      nome: true,
      telefone1: true,
      dataNascimento: true,
    },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const body = await req.json();

  const cliente = await prisma.cliente.create({
    data: {
      tenantId: sessao.tenantId,
      nome: body.nome,
      telefone1: body.telefone1 ?? null,
      telefone2: body.telefone2 ?? null,
      email: body.email ?? null,
      cpf: body.cpf ?? null,
      rg: body.rg ?? null,
      sexo: body.sexo ?? null,
      dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
      endereco: body.endereco ?? null,
      observacao: body.observacao ?? null,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}
