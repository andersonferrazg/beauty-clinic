import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();

  const [tenant, config, status] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: sessao.tenantId },
      select: { id: true, nome: true, cnpj: true, telefone: true, endereco: true, corPrimaria: true },
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
      },
      update: {
        intervaloAgendaMin: body.config.intervaloAgendaMin ?? 30,
        horarioEnvioWpp: body.config.horarioEnvioWpp ?? "08:00",
        mensagemConfirmacaoWpp: body.config.mensagemConfirmacaoWpp || null,
        urlNFSe: body.config.urlNFSe || null,
        horaInicioAgenda: body.config.horaInicioAgenda ?? 6,
        horaFimAgenda: body.config.horaFimAgenda ?? 21,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
