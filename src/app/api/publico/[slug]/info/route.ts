import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findFirst({
    where: { slug, ativo: true },
    select: {
      id: true,
      nome: true,
      logoUrl: true,
      corPrimaria: true,
      configuracoes: { select: { agendamentoOnlineAtivo: true } },
    },
  });

  if (!tenant) return NextResponse.json({ erro: "Clínica não encontrada" }, { status: 404 });

  return NextResponse.json({
    nome: tenant.nome,
    logoUrl: tenant.logoUrl,
    corPrimaria: tenant.corPrimaria,
    ativo: tenant.configuracoes?.agendamentoOnlineAtivo ?? false,
  });
}
