import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, temPermissao } from "@/lib/session";

const TIPOS_VALIDOS = ["LIGACAO", "WHATSAPP", "NOTA"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await exigirSessao();
  if (!temPermissao(sessao, "acessarFinanceiro")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const orcamento = await prisma.orcamento.findFirst({
    where: { id, tenantId: sessao.tenantId },
  });
  if (!orcamento) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  const { tipo, texto }: { tipo?: string; texto?: string } = await req.json();
  if (!texto?.trim()) return NextResponse.json({ erro: "Texto obrigatório" }, { status: 400 });

  const interacao = await prisma.interacaoOrcamento.create({
    data: {
      orcamentoId: id,
      tipo: TIPOS_VALIDOS.includes(tipo ?? "") ? tipo! : "NOTA",
      texto: texto.trim(),
    },
  });

  return NextResponse.json(interacao, { status: 201 });
}
