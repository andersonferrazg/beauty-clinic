/**
 * Backfill — Aplica taxa retroativamente em lançamentos de Débito e Link de Pagamento
 * que foram gravados sem desconto de taxa (valorBruto=null, taxa=null).
 *
 * Cenário: esses lançamentos foram criados antes de o admin configurar as taxas,
 * ou antes da feature de taxa estar ativa. O valor gravado é o BRUTO original.
 *
 * Uso:
 *   npx tsx prisma/backfill-taxa.ts
 *   (com DATABASE_URL apontando para o banco alvo)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, nome: true } });
  console.log(`Tenants: ${tenants.map(t => t.nome).join(", ")}`);

  for (const tenant of tenants) {
    console.log(`\n=== Tenant: ${tenant.nome} ===`);
    await processarTenant(tenant.id);
  }
}

async function processarTenant(tenantId: string) {
  // Buscar todas as formas de pagamento com taxa > 0 (exceto Cartão de Crédito,
  // que tem configuração própria por parcelamento — não entra neste backfill simples)
  const formasComTaxa = await prisma.formaPagamento.findMany({
    where: {
      tenantId,
      ativa: true,
      percentualTaxa: { gt: 0 },
      nome: { not: "Cartão de Crédito" },
    },
    select: { nome: true, percentualTaxa: true },
  });

  if (formasComTaxa.length === 0) {
    console.log("Nenhuma forma de pagamento com taxa configurada (além de Crédito).");
    return;
  }

  console.log("Formas com taxa:");
  for (const f of formasComTaxa) {
    console.log(`  ${f.nome}: ${f.percentualTaxa}%`);
  }

  let total = 0;

  for (const forma of formasComTaxa) {
    // Lançamentos dessa forma sem taxa aplicada (valorBruto=null indica que foi gravado sem desconto)
    const lancamentos = await prisma.lancamento.findMany({
      where: {
        tenantId,
        origem: "AUTO_ATENDIMENTO",
        formaPagamento: forma.nome,
        pago: true,
        valorBruto: null,
      },
      select: { id: true, descricao: true, valor: true },
    });

    if (lancamentos.length === 0) {
      console.log(`\n${forma.nome}: nenhum lançamento sem taxa.`);
      continue;
    }

    console.log(`\n${forma.nome} (taxa ${forma.percentualTaxa}%) — ${lancamentos.length} lançamento(s):`);

    for (const lanc of lancamentos) {
      const valorBruto = lanc.valor; // valor atual É o bruto (taxa não foi descontada)
      const taxaValor  = Math.round(valorBruto * (forma.percentualTaxa / 100) * 100) / 100;
      const valorLiquido = Math.round((valorBruto - taxaValor) * 100) / 100;

      console.log(`  → ${lanc.descricao} | bruto: R$${valorBruto} | taxa: R$${taxaValor} | líquido: R$${valorLiquido}`);

      await prisma.lancamento.update({
        where: { id: lanc.id },
        data: {
          valor: valorLiquido,
          valorBruto,
          taxa: taxaValor,
          percentualTaxa: forma.percentualTaxa,
        },
      });

      console.log(`    ✅ atualizado`);
      total++;
    }
  }

  console.log(`\n✅ ${total} lançamento(s) corrigido(s) com taxa retroativa.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
