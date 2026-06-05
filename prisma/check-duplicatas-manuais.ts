import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: "lb-beauty-clinic" } });
  if (!tenant) { console.log("Tenant não encontrado"); return; }

  const buscas = [
    "v.brasileiro",
    "sobrancelha",
    "lash lift",
    "lash lifth",
    "remoção",
  ];

  for (const termo of buscas) {
    const servicos = await prisma.servico.findMany({
      where: {
        tenantId: tenant.id,
        nome: { contains: termo },
      },
      select: { id: true, nome: true, categoria: true, ativo: true, criadoEm: true },
      orderBy: { criadoEm: "asc" },
    });
    if (servicos.length > 0) {
      console.log(`\n── Busca: "${termo}" ──`);
      for (const s of servicos) {
        const ag = await prisma.itemAgendamento.count({ where: { servicoId: s.id } });
        const orc = await prisma.itemOrcamento.count({ where: { servicoId: s.id } });
        console.log(`  [${s.ativo ? "ativo" : "INATIVO"}] "${s.nome}" [${s.categoria ?? "SEM CAT"}] — ${ag} agend, ${orc} orç  id=${s.id}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
