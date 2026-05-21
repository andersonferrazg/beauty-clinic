import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const completo = req.nextUrl.searchParams.get("historico") === "completo";

  const cliente = await prisma.cliente.findFirst({
    where: { id, tenantId: sessao.tenantId, ativo: true },
    include: {
      agendamentos: {
        orderBy: { inicio: "desc" },
        ...(completo ? {} : { take: 10 }),
        include: {
          itens: { include: { servico: { select: { id: true, nome: true, cor: true } } } },
          status: { select: { nome: true, cor: true } },
          profissional: { select: { id: true, nome: true, cor: true } },
        },
      },
    },
  });

  if (!cliente) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  await prisma.cliente.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: {
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

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  await prisma.cliente.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: { ativo: false },
  });

  return new NextResponse(null, { status: 204 });
}
