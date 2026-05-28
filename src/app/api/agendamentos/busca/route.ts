import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const nome = req.nextUrl.searchParams.get("nome") || "";
  const limite = Math.min(parseInt(req.nextUrl.searchParams.get("limite") || "30"), 100);

  if (!nome.trim()) return NextResponse.json([]);

  const provider = process.env.DATABASE_PROVIDER || "sqlite";

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      tenantId: sessao.tenantId,
      cliente: {
        nome: {
          contains: nome,
          ...(provider === "postgresql" ? { mode: "insensitive" as const } : {}),
        },
      },
    },
    include: {
      cliente: { select: { id: true, nome: true, telefone1: true } },
      profissional: { select: { id: true, nome: true, cor: true } },
      status: true,
      itens: {
        include: {
          servico: { select: { id: true, nome: true, cor: true, duracaoMin: true } },
        },
      },
    },
    orderBy: { inicio: "desc" },
    take: limite,
  });

  return NextResponse.json(agendamentos);
}
