import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { processarStatusAgendamento } from "@/lib/finalizar-agendamento";

export async function GET(req: NextRequest) {
  const sessao = await exigirSessao();
  const data = req.nextUrl.searchParams.get("data");
  const profissionalId = req.nextUrl.searchParams.get("profissionalId");

  let inicioDia: Date;
  let fimDia: Date;

  if (data) {
    inicioDia = new Date(data + "T00:00:00");
    fimDia = new Date(data + "T23:59:59");
  } else {
    const hoje = new Date();
    inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
  }

  const where: Record<string, unknown> = {
    tenantId: sessao.tenantId,
    inicio: { gte: inicioDia, lte: fimDia },
  };

  // Profissional vê apenas seus próprios agendamentos; admin vê todos
  if (!sessao.isAdmin && sessao.profissionalId) {
    where.profissionalId = sessao.profissionalId;
  } else if (profissionalId) {
    where.profissionalId = profissionalId;
  }

  const agendamentos = await prisma.agendamento.findMany({
    where,
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
    orderBy: { inicio: "asc" },
  });

  return NextResponse.json(agendamentos);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const body = await req.json();

  const {
    profissionalId,
    clienteId,
    statusId,
    inicio,
    fim,
    corCustom,
    observacao,
    formaPagamento,
    valorTotal,
    itens, // [{ servicoId, preco }]
    tipo,  // "agendamento" | "bloqueio"
    motivoBloqueio,
  } = body;

  // Agendamento normal
  const agendamento = await prisma.agendamento.create({
    data: {
      tenantId: sessao.tenantId,
      profissionalId,
      clienteId: clienteId || null,
      statusId: statusId || null,
      inicio: new Date(inicio),
      fim: new Date(fim),
      corCustom: corCustom || null,
      observacao: observacao || motivoBloqueio || null,
      formaPagamento: formaPagamento || null,
      valorTotal: valorTotal || null,
      itens: itens?.length
        ? {
            create: itens.map((item: { servicoId: string; preco: number }) => ({
              servicoId: item.servicoId,
              preco: item.preco,
              quantidade: 1,
            })),
          }
        : undefined,
    },
    include: {
      cliente: { select: { id: true, nome: true } },
      profissional: { select: { id: true, nome: true, cor: true } },
      status: true,
      itens: { include: { servico: true } },
    },
  });

  // Se for bloqueio, cria também um registro em Bloqueio
  if (tipo === "bloqueio") {
    await prisma.bloqueio.create({
      data: {
        tenantId: sessao.tenantId,
        profissionalId,
        inicio: new Date(inicio),
        fim: new Date(fim),
        motivo: motivoBloqueio || null,
      },
    });
  }

  // Se o agendamento já foi criado com status "finalizado", roda o trigger
  if (statusId) {
    try {
      await processarStatusAgendamento(agendamento.id, sessao.tenantId, statusId);
    } catch (e) {
      console.error("Erro ao processar status no POST:", e);
    }
  }

  return NextResponse.json(agendamento, { status: 201 });
}
