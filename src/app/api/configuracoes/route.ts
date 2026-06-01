import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();

  const [tenant, config, status] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: sessao.tenantId },
      select: { id: true, nome: true, cnpj: true, telefone: true, endereco: true, corPrimaria: true, slug: true },
    }),
    prisma.tenantConfig.findUnique({ where: { tenantId: sessao.tenantId } }),
    prisma.statusAgenda.findMany({
      where: { tenantId: sessao.tenantId },
      orderBy: { ordem: "asc" },
    }),
  ]);

  return NextResponse.json({ tenant, config, status });
}

export async function PATCH(req: NextRequest) {
  const sessao = await exigirSessao();
  const body = await req.json();

  // Dados da clínica e urlNFSe são restritos a admin
  if ((body.tenant || body.config?.urlNFSe !== undefined) && !sessao.permissoes.isAdmin) {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  if (body.tenant) {
    await prisma.tenant.update({
      where: { id: sessao.tenantId },
      data: {
        nome: body.tenant.nome,
        cnpj: body.tenant.cnpj ?? null,
        telefone: body.tenant.telefone ?? null,
        endereco: body.tenant.endereco ?? null,
      },
    });
  }

  if (body.config) {
    await prisma.tenantConfig.upsert({
      where: { tenantId: sessao.tenantId },
      create: {
        tenantId: sessao.tenantId,
        intervaloAgendaMin: body.config.intervaloAgendaMin ?? 30,
        horarioEnvioWpp: body.config.horarioEnvioWpp ?? "08:00",
        horaInicioAgenda: body.config.horaInicioAgenda ?? 6,
        horaFimAgenda: body.config.horaFimAgenda ?? 21,
        agendamentoOnlineAtivo: body.config.agendamentoOnlineAtivo ?? false,
        emailNotificacoes: body.config.emailNotificacoes || null,
        notificarPorEmail: body.config.notificarPorEmail ?? true,
      },
      update: {
        intervaloAgendaMin: body.config.intervaloAgendaMin ?? 30,
        horarioEnvioWpp: body.config.horarioEnvioWpp ?? "08:00",
        mensagemConfirmacaoWpp: body.config.mensagemConfirmacaoWpp || null,
        mensagemAniversarioWpp: body.config.mensagemAniversarioWpp || null,
        ...(sessao.permissoes.isAdmin && body.config.urlNFSe !== undefined ? { urlNFSe: body.config.urlNFSe || null } : {}),
        horaInicioAgenda: body.config.horaInicioAgenda ?? 6,
        horaFimAgenda: body.config.horaFimAgenda ?? 21,
        agendamentoOnlineAtivo: body.config.agendamentoOnlineAtivo ?? false,
        emailNotificacoes: body.config.emailNotificacoes || null,
        notificarPorEmail: body.config.notificarPorEmail ?? true,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
