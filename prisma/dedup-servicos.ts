/**
 * Script de deduplicação de serviços.
 * Uso:
 *   npx tsx prisma/dedup-servicos.ts          → dry-run (só lista, não muda nada)
 *   npx tsx prisma/dedup-servicos.ts --apply  → aplica as mesclagens
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

function normalizar(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")    // remove acentos
    .replace(/\s+/g, " ");              // colapsa espaços múltiplos
}

function categoriaValida(cat: string | null): boolean {
  if (!cat) return false;
  const norm = cat.trim().toLowerCase();
  return norm !== "" && norm !== "sem categoria" && norm !== "sem_categoria";
}

async function main() {
  console.log(`\n🔍 Deduplicação de serviços — modo: ${APPLY ? "APLICAR" : "DRY-RUN"}\n`);

  const tenant = await prisma.tenant.findFirst({ where: { slug: "lb-beauty-clinic" } });
  if (!tenant) { console.log("❌ Tenant não encontrado"); return; }

  const servicos = await prisma.servico.findMany({
    where: { tenantId: tenant.id, ativo: true },
    orderBy: { criadoEm: "asc" },
  });

  console.log(`📋 Total de serviços ativos: ${servicos.length}\n`);

  // Agrupa por nome normalizado
  const grupos = new Map<string, typeof servicos>();
  for (const s of servicos) {
    const key = normalizar(s.nome);
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(s);
  }

  const duplicados = [...grupos.entries()].filter(([, lista]) => lista.length > 1);
  console.log(`🔁 Grupos com duplicatas: ${duplicados.length}\n`);

  let totalMesclados = 0;

  for (const [chaveNorm, lista] of duplicados) {
    // Escolher o "mantido": prefere o que tem categoria válida; entre iguais, o mais antigo
    const comCategoria = lista.filter((s) => categoriaValida(s.categoria));
    const semCategoria = lista.filter((s) => !categoriaValida(s.categoria));
    const mantido = comCategoria.length > 0 ? comCategoria[0] : lista[0];
    const remover = lista.filter((s) => s.id !== mantido.id);

    console.log(`▶ "${chaveNorm}"`);
    console.log(`  MANTIDO  : "${mantido.nome}" [${mantido.categoria ?? "SEM CAT"}] (id: ${mantido.id.slice(0,8)})`);
    for (const r of remover) {
      // Contar vínculos
      const qtdAg = await prisma.itemAgendamento.count({ where: { servicoId: r.id } });
      const qtdOrc = await prisma.itemOrcamento.count({ where: { servicoId: r.id } });
      console.log(`  REMOVER  : "${r.nome}" [${r.categoria ?? "SEM CAT"}] — ${qtdAg} agend., ${qtdOrc} orç. (id: ${r.id.slice(0,8)})`);

      if (APPLY) {
        if (qtdAg > 0) {
          await prisma.itemAgendamento.updateMany({
            where: { servicoId: r.id },
            data: { servicoId: mantido.id },
          });
        }
        if (qtdOrc > 0) {
          await prisma.itemOrcamento.updateMany({
            where: { servicoId: r.id },
            data: { servicoId: mantido.id },
          });
        }
        await prisma.servico.update({
          where: { id: r.id },
          data: { ativo: false },
        });
      }

      totalMesclados++;
    }
    console.log("");
  }

  // Resumo
  const servicosAtivos = await prisma.servico.count({ where: { tenantId: tenant.id, ativo: true } });
  const totalFinal = APPLY ? servicosAtivos : servicos.length - totalMesclados;

  console.log("─".repeat(60));
  if (APPLY) {
    console.log(`✅ Aplicado! ${totalMesclados} serviço(s) inativado(s).`);
    console.log(`   Total de serviços ativos agora: ${servicosAtivos}`);
  } else {
    console.log(`📊 Dry-run: ${totalMesclados} serviço(s) seriam inativados.`);
    console.log(`   Total após deduplicação: ~${totalFinal}`);
    console.log(`\n   Para aplicar: npx tsx prisma/dedup-servicos.ts --apply`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
