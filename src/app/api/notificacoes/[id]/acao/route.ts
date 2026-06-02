import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const { acao } = await req.json() as { acao: "confirmar" | "cancelar" };

  const notif = await prisma.notificacaoSistema.findFirst({
    where: { id, tenantId: sessao.tenantId },
  });
  if (!notif) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });

  // Extrai o ID do agendamento do linkRelativo: /agenda?data=...&abrir=<id>
  const match = notif.linkRelativo?.match(/abrir=([^&]+)/);
  const agendamentoId = match?.[1];
  if (!agendamentoId) return NextResponse.json({ erro: "Agendamento não localizado" }, { status: 400 });

  const nomeStatus = acao === "confirmar" ? "Confirmado" : "Cancelado";
  const status = await prisma.statusAgenda.findFirst({
    where: { tenantId: sessao.tenantId, nome: nomeStatus },
  });
  if (!status) return NextResponse.json({ erro: `Status "${nomeStatus}" não encontrado` }, { status: 400 });

  await prisma.agendamento.updateMany({
    where: { id: agendamentoId, tenantId: sessao.tenantId },
    data: { statusId: status.id },
  });

  await prisma.notificacaoSistema.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: { lida: true },
  });

  return NextResponse.json({ ok: true });
}
