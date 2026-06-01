import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  await prisma.statusAgenda.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: {
      nome: body.nome,
      cor: body.cor,
      contaConfirmado: body.contaConfirmado,
      ordem: body.ordem,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const status = await prisma.statusAgenda.findFirst({
    where: { id, tenantId: sessao.tenantId },
  });

  if (!status) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  if (status.sistemico) {
    return NextResponse.json({ erro: "Este status é do sistema e não pode ser excluído." }, { status: 400 });
  }

  const total = await prisma.agendamento.count({ where: { statusId: id } });
  if (total > 0) {
    return NextResponse.json(
      { erro: `Há ${total} agendamento(s) com este status. Mude-os antes de excluir.` },
      { status: 400 }
    );
  }

  await prisma.statusAgenda.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
