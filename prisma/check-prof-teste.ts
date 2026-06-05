import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: "lb-beauty-clinic" } });
  if (!tenant) { console.log("Tenant não encontrado"); return; }

  const profs = await prisma.profissional.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, nome: true, ativo: true },
    orderBy: { nome: "asc" },
  });
  console.log("Profissionais:", JSON.stringify(profs, null, 2));

  // Procurar a profissional de teste
  const teste = profs.find((p) =>
    p.nome.toLowerCase().includes("teste") ||
    p.nome.toLowerCase().includes("dra. lunna bordin") && !p.nome.includes("Bordin\n")
  );

  if (!teste) {
    const lunnas = profs.filter((p) => p.nome.toLowerCase().includes("lunna"));
    console.log("\nLunnas encontradas:", JSON.stringify(lunnas, null, 2));
    return;
  }

  const agQtd = await prisma.agendamento.count({ where: { profissionalId: teste.id } });
  const comQtd = await prisma.comissaoLancamento.count({ where: { profissionalId: teste.id } });
  console.log(`\n"${teste.id}" — "${teste.nome}": ${agQtd} agendamentos, ${comQtd} comissões`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
