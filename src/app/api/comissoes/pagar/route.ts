import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

// POST /api/comissoes/pagar
// body: { ids: string[], formaPagamento?: string }
// Cria uma DESPESA agregada e marca todas as comissões selecionadas como pagas.
export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!sessao.permissoes.isAdmin) {
    return NextResponse.json({ erro: "Apenas administrador pode pagar comissões" }, { status: 403 });
  }

  const { ids, formaPagamento } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ erro: "Selecione ao menos uma comissão" }, { status: 400 });
  }

  const comissoes = await prisma.comissaoLancamento.findMany({
    where: { id: { in: ids }, tenantId: sessao.tenantId, pago: false },
    include: { profissional: { select: { id: true, nome: true } } },
  });

  if (comissoes.length === 0) {
    return NextResponse.json({ erro: "Nenhuma comissão pendente encontrada" }, { status: 400 });
  }

  // Agrupa por profissional (um lançamento por profissional)
  const porProfissional: Record<string, typeof comissoes> = {};
  for (const c of comissoes) {
    if (!porProfissional[c.profissionalId]) porProfissional[c.profissionalId] = [];
    porProfissional[c.profissionalId].push(c);
  }

  const resultado: { profissional: string; lancamentoId: string; valor: number }[] = [];

  await prisma.$transaction(async (tx) => {
    for (const profId of Object.keys(porProfissional)) {
      const lista = porProfissional[profId];
      const total = lista.reduce((s, c) => s + c.valorComissao, 0);
      const nomeProf = lista[0].profissional.nome;

      // Se a colaboradora paga a clínica → cria RECEITA; senão DESPESA
      const colaboradoraPaga = lista[0].direcaoComissao === "COLABORADORA_PAGA";
      const lanc = await tx.lancamento.create({
        data: {
          tenantId: sessao.tenantId,
          tipo: colaboradoraPaga ? "RECEITA" : "DESPESA",
          categoria: "Comissões",
          descricao: colaboradoraPaga
            ? `Repasse recebido — ${nomeProf} (${lista.length} atendimento${lista.length > 1 ? "s" : ""})`
            : `Pagamento de comissão — ${nomeProf} (${lista.length} atendimento${lista.length > 1 ? "s" : ""})`,
          valor: total,
          pago: true,
          pagoEm: new Date(),
          formaPagamento: formaPagamento || null,
          origem: "AUTO_COMISSAO",
        },
      });

      await tx.comissaoLancamento.updateMany({
        where: { id: { in: lista.map((c) => c.id) } },
        data: { pago: true, pagoEm: new Date(), lancamentoPagamentoId: lanc.id },
      });

      resultado.push({ profissional: nomeProf, lancamentoId: lanc.id, valor: total });
    }
  });

  return NextResponse.json({ pagamentos: resultado }, { status: 201 });
}
