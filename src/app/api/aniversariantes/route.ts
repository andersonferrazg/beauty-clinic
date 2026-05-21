import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();

  const [clientes, tenant] = await Promise.all([
    prisma.cliente.findMany({
      where: { tenantId: sessao.tenantId, ativo: true, dataNascimento: { not: null } },
      select: { id: true, nome: true, telefone1: true, dataNascimento: true },
    }),
    prisma.tenant.findFirst({
      where: { id: sessao.tenantId },
      select: { nome: true },
    }),
  ]);

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const diaAtual = hoje.getDate();

  const aniversariantes = clientes
    .filter((c) => {
      const dn = new Date(c.dataNascimento!);
      return dn.getMonth() === mesAtual;
    })
    .map((c) => {
      const dn = new Date(c.dataNascimento!);
      const dia = dn.getDate();
      const diasAte = dia - diaAtual;
      return {
        id: c.id,
        nome: c.nome,
        telefone1: c.telefone1,
        dataNascimento: c.dataNascimento,
        dia,
        diasAte,
        ehHoje: dia === diaAtual,
      };
    })
    .sort((a, b) => {
      if (a.ehHoje && !b.ehHoje) return -1;
      if (!a.ehHoje && b.ehHoje) return 1;
      if (a.diasAte >= 0 && b.diasAte < 0) return -1;
      if (a.diasAte < 0 && b.diasAte >= 0) return 1;
      return a.diasAte - b.diasAte;
    });

  return NextResponse.json({
    aniversariantes,
    mes: mesAtual + 1,
    diaAtual,
    tenantNome: tenant?.nome ?? "Beauty Clinic",
  });
}
