import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

// GET /api/comissoes?mes=YYYY-MM&profissionalId=...&pago=true|false
export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const mes = req.nextUrl.searchParams.get("mes");
  const profissionalId = req.nextUrl.searchParams.get("profissionalId");
  const pagoParam = req.nextUrl.searchParams.get("pago");

  const where: Record<string, unknown> = { tenantId: sessao.tenantId };

  if (mes) {
    const [ano, m] = mes.split("-").map(Number);
    const inicio = new Date(ano, m - 1, 1);
    const fim = new Date(ano, m, 1);
    where.criadoEm = { gte: inicio, lt: fim };
  }
  if (profissionalId) where.profissionalId = profissionalId;
  if (pagoParam === "true") where.pago = true;
  if (pagoParam === "false") where.pago = false;

  // Profissional vê só as próprias comissões
  if (!sessao.permissoes.isAdmin && sessao.profissionalId) {
    where.profissionalId = sessao.profissionalId;
  }

  const comissoes = await prisma.comissaoLancamento.findMany({
    where,
    include: {
      profissional: { select: { id: true, nome: true, cor: true } },
      lancamento: {
        select: {
          id: true,
          valor: true,
          pagoEm: true,
          descricao: true,
          agendamento: {
            select: {
              id: true,
              inicio: true,
              cliente: { select: { id: true, nome: true } },
            },
          },
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(comissoes);
}
