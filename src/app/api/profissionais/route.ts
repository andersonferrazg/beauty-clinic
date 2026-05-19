import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();

  const profissionais = await prisma.profissional.findMany({
    where: { tenantId: sessao.tenantId, ativo: true },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      especialidade: true,
      cor: true,
      tipoComissao: true,
      percentualComissao: true,
      salarioFixo: true,
      whatsappAtivo: true,
      registro: true,
      direcaoComissao: true,
    },
  });

  return NextResponse.json(profissionais);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const body = await req.json();

  const profissional = await prisma.profissional.create({
    data: {
      tenantId: sessao.tenantId,
      nome: body.nome,
      email: body.email ?? null,
      telefone: body.telefone ?? null,
      especialidade: body.especialidade ?? null,
      registro: body.registro ?? null,
      cor: body.cor ?? "#B89968",
      tipoComissao: body.tipoComissao ?? "PERCENTUAL",
      percentualComissao: body.percentualComissao ? Number(body.percentualComissao) : null,
      salarioFixo: body.salarioFixo ? Number(body.salarioFixo) : null,
      direcaoComissao: body.direcaoComissao ?? "CLINICA_PAGA",
      frequenciaComissao: body.frequenciaComissao ?? "MENSAL",
    },
  });

  return NextResponse.json(profissional, { status: 201 });
}
