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

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!temPermissao(sessao, "acessarFinanceiro")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const clienteId = req.nextUrl.searchParams.get("clienteId");
  const profissionalId = req.nextUrl.searchParams.get("profissionalId");
  const q = req.nextUrl.searchParams.get("q");

  // Expirar automaticamente os que passaram da validade
  await prisma.orcamento.updateMany({
    where: {
      tenantId: sessao.tenantId,
      status: "EM_ABERTO",
      dataValidade: { lt: new Date() },
    },
    data: { status: "EXPIRADO" },
  });

  const where: Record<string, unknown> = { tenantId: sessao.tenantId };
  if (status) where.status = status;
  if (clienteId) where.clienteId = clienteId;
  if (profissionalId === "none") where.profissionalId = null;
  else if (profissionalId) where.profissionalId = profissionalId;
  if (q) {
    where.cliente = { nome: { contains: q } };
  }

  const orcamentos = await prisma.orcamento.findMany({
    where,
    include: {
      cliente: { select: { id: true, nome: true, telefone1: true } },
      profissional: { select: { id: true, nome: true, cor: true } },
      itens: {
        include: {
          servico: { select: { id: true, nome: true, cor: true } },
          produto: { select: { id: true, nome: true } },
        },
      },
      agendamento: { select: { id: true, inicio: true, dataRealizado: true } },
    },
    orderBy: { criadoEm: "desc" },
    take: 200,
  });

  return NextResponse.json(orcamentos);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!temPermissao(sessao, "acessarFinanceiro")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const {
    clienteId,
    profissionalId,
    observacao,
    diasValidade,
    dataValidade,
    itens,
  }: {
    clienteId: string;
    profissionalId?: string | null;
    observacao?: string | null;
    diasValidade?: number;
    dataValidade?: string | null;
    itens?: ItemBody[];
  } = body;

  if (!clienteId) {
    return NextResponse.json({ erro: "Cliente é obrigatório" }, { status: 400 });
  }

  const validade = dataValidade
    ? new Date(dataValidade)
    : new Date(Date.now() + (diasValidade ?? 30) * 24 * 60 * 60 * 1000);

  const itensValidos = (itens ?? []).filter((i) => i.servicoId || i.produtoId);

  const orcamento = await prisma.orcamento.create({
    data: {
      tenantId: sessao.tenantId,
      clienteId,
      profissionalId: profissionalId || sessao.profissionalId || null,
      dataValidade: validade,
      observacao: observacao || null,
      valorTotal: calcularTotal(itensValidos),
      itens: itensValidos.length
        ? {
            create: itensValidos.map((i) => ({
              servicoId: i.servicoId || null,
              produtoId: i.produtoId || null,
              preco: i.preco,
              quantidade: i.quantidade ?? 1,
              descricao: i.descricao || null,
            })),
          }
        : undefined,
    },
    include: {
      cliente: { select: { id: true, nome: true, telefone1: true } },
      profissional: { select: { id: true, nome: true } },
      itens: { include: { servico: true, produto: true } },
    },
  });

  return NextResponse.json(orcamento, { status: 201 });
}
