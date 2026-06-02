/**
 * Adiciona "Retorno" como forma de pagamento para todos os tenants que ainda não têm.
 * Execução: npx tsx prisma/patch-retorno.ts
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({ where: { ativo: true } });

  for (const tenant of tenants) {
    const existe = await prisma.formaPagamento.findFirst({
      where: { tenantId: tenant.id, nome: "Retorno" },
    });
    if (existe) {
      console.log(`[${tenant.nome}] "Retorno" já existe — pulando`);
      continue;
    }
    await prisma.formaPagamento.create({
      data: {
        tenantId: tenant.id,
        nome: "Retorno",
        ativa: true,
        percentualTaxa: 0,
      },
    });
    console.log(`[${tenant.nome}] "Retorno" adicionado ✓`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
