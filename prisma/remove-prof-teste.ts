import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TESTE_ID = "cmpvadnqp000evbwwpf01cxlt"; // "Dra. Lunna Bordin teste"
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`Modo: ${APPLY ? "APLICAR" : "DRY-RUN"}\n`);

  const prof = await prisma.profissional.findUnique({ where: { id: TESTE_ID } });
  if (!prof) { console.log("Profissional não encontrada"); return; }
  console.log(`Profissional: "${prof.nome}" (ativo: ${prof.ativo})`);

  const agQtd = await prisma.agendamento.count({ where: { profissionalId: TESTE_ID } });
  const comQtd = await prisma.comissaoLancamento.count({ where: { profissionalId: TESTE_ID } });
  console.log(`Agendamentos vinculados: ${agQtd}`);
  console.log(`Comissões vinculadas: ${comQtd}`);

  if (agQtd > 0 || comQtd > 0) {
    console.log("\n⚠️  Há dados vinculados — vamos apenas INATIVAR (ativo: false), não remover.");
    if (APPLY) {
      await prisma.profissional.update({ where: { id: TESTE_ID }, data: { ativo: false } });

      // Inativar também o usuário vinculado à profissional teste (se existir)
      const usuario = await prisma.usuario.findFirst({ where: { profissionalId: TESTE_ID } });
      if (usuario) {
        await prisma.usuario.update({ where: { id: usuario.id }, data: { ativo: false } });
        console.log(`   Usuário "${usuario.email}" também inativado.`);
      }
      console.log(`✅ Profissional "${prof.nome}" inativada.`);
    }
  } else {
    console.log("\n✅ Sem dados vinculados — pode remover completamente.");
    if (APPLY) {
      const usuario = await prisma.usuario.findFirst({ where: { profissionalId: TESTE_ID } });
      if (usuario) {
        await prisma.usuarioPermissao.deleteMany({ where: { usuarioId: usuario.id } });
        await prisma.usuario.delete({ where: { id: usuario.id } });
        console.log(`   Usuário "${usuario.email}" removido.`);
      }
      await prisma.profissional.delete({ where: { id: TESTE_ID } });
      console.log(`✅ Profissional "${prof.nome}" removida completamente.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
