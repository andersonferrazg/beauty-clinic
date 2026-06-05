/**
 * Merge manual das 4 duplicatas restantes (nomes com abreviações/typos).
 * Todas têm 0 agendamentos e 0 orçamentos — só inativa o duplicado.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const MERGES = [
  {
    manter: { id: "cmpcsud9j004cvb14s91p35ss", nome: "Combo Vol. Brasileiro + Sobrancelha" },
    remover: { id: "cmpcx6c4p00l5vbe8hlglvr3z", nome: "Combo v.brasileiro+ sobrancelha" },
  },
  {
    manter: { id: "cmpcsubs00038vb14ufw3sdl4", nome: "Lash Lift" },
    remover: { id: "cmpcx6cyd00lhvbe88kiy1m4a", nome: "Lash lifth" },
  },
  {
    manter: { id: "cmpcsud3s0048vb14zzzp2yvr", nome: "Remoção de Unha" },
    remover: { id: "cmpcx6fbh00mjvbe8sldr6ack", nome: "Remoção unha" },
  },
  {
    manter: { id: "cmpcsubv6003avb14axg6cta8", nome: "Remoção de Cílios" },
    remover: { id: "cmpcx6f3r00mfvbe8jpup4nb1", nome: "Remoção (genérico)" },
  },
];

async function main() {
  console.log(`\nModo: ${APPLY ? "APLICAR" : "DRY-RUN"}\n`);

  for (const { manter, remover } of MERGES) {
    const ag = await prisma.itemAgendamento.count({ where: { servicoId: remover.id } });
    const orc = await prisma.itemOrcamento.count({ where: { servicoId: remover.id } });
    console.log(`▶ MANTER   : "${manter.nome}"`);
    console.log(`  REMOVER  : "${remover.nome}" — ${ag} agend, ${orc} orç`);

    if (APPLY) {
      if (ag > 0) await prisma.itemAgendamento.updateMany({ where: { servicoId: remover.id }, data: { servicoId: manter.id } });
      if (orc > 0) await prisma.itemOrcamento.updateMany({ where: { servicoId: remover.id }, data: { servicoId: manter.id } });
      await prisma.servico.update({ where: { id: remover.id }, data: { ativo: false } });
      console.log(`  ✅ Inativado`);
    }
    console.log("");
  }

  if (!APPLY) console.log("Para aplicar: npx tsx prisma/merge-duplicatas-manuais.ts --apply");
}

main().catch(console.error).finally(() => prisma.$disconnect());
