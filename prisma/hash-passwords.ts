import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const usuarios = await prisma.usuario.findMany({ select: { id: true, email: true, senhaHash: true } });

  let atualizados = 0;
  for (const u of usuarios) {
    // Bcrypt hashes começam com $2b$ ou $2a$ — pular se já estiver hasheado
    if (u.senhaHash.startsWith("$2")) continue;

    const hash = await bcrypt.hash(u.senhaHash, 10);
    await prisma.usuario.update({ where: { id: u.id }, data: { senhaHash: hash } });
    console.log(`✅ ${u.email} — senha convertida`);
    atualizados++;
  }

  if (atualizados === 0) {
    console.log("Todas as senhas já estão com hash bcrypt.");
  } else {
    console.log(`\n${atualizados} senha(s) convertida(s) com sucesso.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
