import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const profissional = await prisma.profissional.findFirst({
    where: { id, tenantId: sessao.tenantId, ativo: true },
  });

  if (!profissional) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  return NextResponse.json(profissional);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  const novoTipo: string = body.tipoComissao ?? "PERCENTUAL";
  const novoPercentual: number | null = body.percentualComissao ? Number(body.percentualComissao) : null;
  const novaDirecao: string = body.direcaoComissao ?? "CLINICA_PAGA";

  await prisma.$transaction(async (tx) => {
    await tx.profissional.updateMany({
      where: { id, tenantId: sessao.tenantId },
      data: {
        nome: body.nome,
        email: body.email ?? null,
        telefone: body.telefone ?? null,
        especialidade: body.especialidade ?? null,
        registro: body.registro ?? null,
        cor: body.cor ?? "#B89968",
        tipoComissao: novoTipo,
        percentualComissao: novoPercentual,
        salarioFixo: body.salarioFixo ? Number(body.salarioFixo) : null,
        direcaoComissao: novaDirecao,
        frequenciaComissao: body.frequenciaComissao ?? "MENSAL",
      },
    });

    // Recalcula comissões pendentes (não pagas) deste profissional
    const comissoesPendentes = await tx.comissaoLancamento.findMany({
      where: { profissionalId: id, tenantId: sessao.tenantId, pago: false },
      select: { id: true, valorBase: true },
    });

    for (const c of comissoesPendentes) {
      let novoValorComissao = 0;
      let novoPercentualUsado: number | null = null;

      if (novoTipo === "INTEGRAL") {
        novoValorComissao = c.valorBase;
        novoPercentualUsado = 100;
      } else if (novoTipo === "PERCENTUAL" && novoPercentual) {
        novoValorComissao = c.valorBase * (novoPercentual / 100);
        novoPercentualUsado = novoPercentual;
      }
      // SALARIO_FIXO e SEM_COMISSAO: remove a comissão pendente (valor 0 → deleta)

      if (novoValorComissao > 0) {
        await tx.comissaoLancamento.update({
          where: { id: c.id },
          data: {
            percentual: novoPercentualUsado,
            valorComissao: novoValorComissao,
            direcaoComissao: novaDirecao,
          },
        });
      } else {
        // Tipo mudou para SEM_COMISSAO ou SALARIO_FIXO: remove comissão pendente
        await tx.comissaoLancamento.delete({ where: { id: c.id } });
      }
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  await prisma.profissional.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: { ativo: false },
  });

  return new NextResponse(null, { status: 204 });
}
