import { prisma } from "@/lib/prisma";

/**
 * Para cada Lancamento com recorrencia="MENSAL", garante que a próxima
 * iteração mensal exista (vencimento = último_vencimento + 1 mês).
 *
 * Só cria a próxima iteração se a data prevista estiver até 32 dias no futuro
 * — evita gerar dezenas de meses adiantados de uma vez.
 *
 * Idempotente: pode ser chamado várias vezes sem efeito colateral.
 * A chave de unicidade é (tenantId, tipo, descricao, categoria, mês do vencimento).
 */
export async function processarRecorrenciasMensais(tenantId: string): Promise<number> {
  const todosMensais = await prisma.lancamento.findMany({
    where: { tenantId, recorrencia: "MENSAL" },
    orderBy: { vencimento: "desc" },
  });

  const porChave: Record<string, typeof todosMensais> = {};
  for (const l of todosMensais) {
    const chave = `${l.tipo}|${l.descricao}|${l.categoria ?? ""}`;
    if (!porChave[chave]) porChave[chave] = [];
    porChave[chave].push(l);
  }

  const limiteFuturo = 32 * 24 * 60 * 60 * 1000; // 32 dias em ms
  const hoje = new Date();
  let criados = 0;

  for (const chave of Object.keys(porChave)) {
    const ultimo = porChave[chave][0]; // ordenado desc
    if (!ultimo.vencimento) continue;

    const proxVencimento = new Date(ultimo.vencimento);
    proxVencimento.setMonth(proxVencimento.getMonth() + 1);

    if (proxVencimento.getTime() - hoje.getTime() > limiteFuturo) continue;

    const inicioMes = new Date(proxVencimento.getFullYear(), proxVencimento.getMonth(), 1);
    const fimMes = new Date(proxVencimento.getFullYear(), proxVencimento.getMonth() + 1, 1);

    const existe = await prisma.lancamento.findFirst({
      where: {
        tenantId,
        tipo: ultimo.tipo,
        descricao: ultimo.descricao,
        categoria: ultimo.categoria,
        recorrencia: "MENSAL",
        vencimento: { gte: inicioMes, lt: fimMes },
      },
    });
    if (existe) continue;

    await prisma.lancamento.create({
      data: {
        tenantId,
        tipo: ultimo.tipo,
        categoria: ultimo.categoria,
        descricao: ultimo.descricao,
        valor: ultimo.valor,
        vencimento: proxVencimento,
        pago: false,
        recorrencia: "MENSAL",
        formaPagamento: ultimo.formaPagamento,
        origem: "AUTO_RECORRENCIA",
      },
    });
    criados++;
  }

  return criados;
}
