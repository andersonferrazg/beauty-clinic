import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, temPermissao } from "@/lib/session";

type ItemBody = {
  servicoId?: string | null;
  produtoId?: string | null;
  preco: number;
  quantidade?: number;
  descricao?: string | null;
};

function calcularTotal(itens: ItemBody[]): number {
  return itens.reduce((s, i) => s + i.preco * (i.quantidade ?? 1), 0);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await exigirSessao();
  if (!temPermissao(sessao, "acessarFinanceiro")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const orcamento = await prisma.orcamento.findFirst({
    where: { id, tenantId: sessao.tenantId },
    include: {
      cliente: true,
      profissional: { select: { id: true, nome: true, cor: true, registro: true } },
      itens: { include: { servico: true, produto: true } },
      agendamento: { select: { id: true, inicio: true, dataRealizado: true } },
      interacoes: { orderBy: { criadoEm: "desc" } },
    },
  });

  if (!orcamento) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  return NextResponse.json(orcamento);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await exigirSessao();
  if (!temPermissao(sessao, "acessarFinanceiro")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const existente = await prisma.orcamento.findFirst({
    where: { id, tenantId: sessao.tenantId },
  });
  if (!existente) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const {
    clienteId,
    profissionalId,
    status,
    observacao,
    dataValidade,
    itens,
  }: {
    clienteId?: string;
    profissionalId?: string | null;
    status?: string;
    observacao?: string | null;
    dataValidade?: string | null;
    itens?: ItemBody[];
  } = body;

  const data: Record<string, unknown> = {};
  if (clienteId !== undefined) data.clienteId = clienteId;
  if (profissionalId !== undefined) data.profissionalId = profissionalId || null;
  if (status !== undefined) data.status = status;
  if (observacao !== undefined) data.observacao = observacao || null;
  if (dataValidade !== undefined && dataValidade) data.dataValidade = new Date(dataValidade);

  if (itens !== undefined) {
    const itensValidos = itens.filter((i) => i.servicoId || i.produtoId);
    data.valorTotal = calcularTotal(itensValidos);
    data.itens = {
      deleteMany: {},
      create: itensValidos.map((i) => ({
        servicoId: i.servicoId || null,
        produtoId: i.produtoId || null,
        preco: i.preco,
        quantidade: i.quantidade ?? 1,
        descricao: i.descricao || null,
      })),
    };
  }

  const atualizado = await prisma.orcamento.update({
    where: { id },
    data,
    include: {
      cliente: { select: { id: true, nome: true, telefone1: true } },
      profissional: { select: { id: true, nome: true } },
      itens: { include: { servico: true, produto: true } },
      agendamento: { select: { id: true, inicio: true, dataRealizado: true } },
    },
  });

  return NextResponse.json(atualizado);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await exigirSessao();
  if (!temPermissao(sessao, "acessarFinanceiro")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const existente = await prisma.orcamento.findFirst({
    where: { id, tenantId: sessao.tenantId },
  });
  if (!existente) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  await prisma.orcamento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
