import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

// GET /api/movimentacoes-estoque?produtoId=...
export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const produtoId = req.nextUrl.searchParams.get("produtoId");
  if (!produtoId) return NextResponse.json({ erro: "produtoId obrigatório" }, { status: 400 });

  const movs = await prisma.movimentacaoEstoque.findMany({
    where: { tenantId: sessao.tenantId, produtoId },
    include: {
      agendamento: {
        select: {
          inicio: true,
          cliente: { select: { nome: true } },
        },
      },
    },
    orderBy: { criadoEm: "desc" },
    take: 50,
  });

  return NextResponse.json(movs);
}

// POST /api/movimentacoes-estoque
// body: { produtoId, tipo: "ENTRADA"|"AJUSTE", quantidade, motivo?, custoUnitario? }
export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin) {
    return NextResponse.json({ erro: "Apenas administrador pode registrar movimentações" }, { status: 403 });
  }

  const body = await req.json();
  const { produtoId, tipo, quantidade, motivo, custoUnitario } = body;

  if (!produtoId || !tipo || !quantidade) {
    return NextResponse.json({ erro: "produtoId, tipo e quantidade são obrigatórios" }, { status: 400 });
  }

  const qtd = Number(quantidade);
  if (isNaN(qtd) || qtd <= 0) {
    return NextResponse.json({ erro: "Quantidade deve ser maior que zero" }, { status: 400 });
  }

  const produto = await prisma.produto.findFirst({
    where: { id: produtoId, tenantId: sessao.tenantId },
  });
  if (!produto) return NextResponse.json({ erro: "Produto não encontrado" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.movimentacaoEstoque.create({
      data: {
        tenantId: sessao.tenantId,
        produtoId,
        tipo,
        quantidade: qtd,
        motivo: motivo || null,
        custoUnitario: custoUnitario ? Number(custoUnitario) : null,
      },
    });

    // ENTRADA soma, AJUSTE substitui pelo novo valor absoluto
    if (tipo === "ENTRADA") {
      await tx.produto.update({
        where: { id: produtoId },
        data: { qtdEstoque: { increment: qtd } },
      });
    } else if (tipo === "AJUSTE") {
      await tx.produto.update({
        where: { id: produtoId },
        data: { qtdEstoque: qtd },
      });
    }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
