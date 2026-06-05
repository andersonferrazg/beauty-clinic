import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const usuario = await prisma.usuario.findFirst({
    where: { email: "beatrizddos1408@gmail.com" },
    include: { permissoes: true },
  });

  if (!usuario) {
    console.log("❌ Usuário beatriz@lbbeautyclinic.com não encontrado.");
    return;
  }

  if (!usuario.permissoes) {
    console.log("❌ Registro de permissões não encontrado para Beatriz.");
    return;
  }

  console.log("Permissões atuais da Beatriz:", {
    isAdmin: usuario.permissoes.isAdmin,
    acessarClientes: usuario.permissoes.acessarClientes,
    acessarProdutos: usuario.permissoes.acessarProdutos,
    acessarServicos: (usuario.permissoes as Record<string, unknown>).acessarServicos,
    acessarFinanceiro: usuario.permissoes.acessarFinanceiro,
    acessarDespesas: usuario.permissoes.acessarDespesas,
  });

  await prisma.usuarioPermissao.update({
    where: { usuarioId: usuario.id },
    data: {
      acessarClientes: false,
      acessarProdutos: false,
      acessarFinanceiro: false,
      acessarDespesas: false,
    },
  });

  console.log("✅ Permissões da Beatriz atualizadas:");
  console.log("  acessarClientes: false");
  console.log("  acessarProdutos: false");
  console.log("  acessarFinanceiro: false");
  console.log("  acessarDespesas: false");
  console.log("  (verAgenda, acessarServicos, verComissoesReceber mantidos como estavam)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
