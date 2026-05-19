import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Tenant: LB Beauty Clinic
  const tenant = await prisma.tenant.upsert({
    where: { slug: "lb-beauty-clinic" },
    update: {},
    create: {
      nome: "LB Beauty Clinic",
      slug: "lb-beauty-clinic",
      cnpj: "50.078.451/0001-10",
      endereco: "R. Toshinobu Katayama, 225 - Centro",
      corPrimaria: "#B89968",
      corSecundaria: "#E8DCC4",
    },
  });

  console.log("✅ Tenant criado:", tenant.nome);

  // Configurações do tenant
  await prisma.tenantConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      intervaloAgendaMin: 30,
      whatsappAtivo: false,
      horarioEnvioWpp: "08:00",
      toleranciaAtrasoMin: 10,
    },
  });

  // Status padrão da agenda (igual ao minhaagendaapp) — limpar e recriar
  await prisma.statusAgenda.deleteMany({ where: { tenantId: tenant.id } });
  const statusPadrao = [
    { nome: "Agendado", cor: "#94a3b8", contaConfirmado: false, ordem: 0 },
    { nome: "Confirmado", cor: "#1e40af", contaConfirmado: true, ordem: 1 },
    { nome: "À confirmar", cor: "#3b82f6", contaConfirmado: false, ordem: 2 },
    { nome: "Finalizado", cor: "#16a34a", contaConfirmado: true, ordem: 3 },
    { nome: "Atrasou", cor: "#ca8a04", contaConfirmado: false, ordem: 4 },
    { nome: "Cancelado", cor: "#dc2626", contaConfirmado: false, ordem: 5 },
    { nome: "Não compareceu", cor: "#ea580c", contaConfirmado: false, ordem: 6 },
  ];

  for (const s of statusPadrao) {
    await prisma.statusAgenda.create({ data: { tenantId: tenant.id, ...s } });
  }

  console.log("✅ Status da agenda criados");

  // Profissionais
  const lunna = await prisma.profissional.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "lunna@lbbeautyclinic.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Dra. Lunna Bordin",
      email: "lunna@lbbeautyclinic.com",
      telefone: "67991859467",
      especialidade: "Biomedicina — Botox e Harmonização Facial",
      tipoComissao: "INTEGRAL",
      percentualComissao: 100,
      cor: "#B89968",
    },
  });

  const beatriz = await prisma.profissional.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "beatriz@lbbeautyclinic.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Beatriz de Lima",
      email: "beatriz@lbbeautyclinic.com",
      especialidade: "Estética — Cílios, Sobrancelha, Massagem",
      tipoComissao: "PERCENTUAL",
      percentualComissao: 70,
      cor: "#c084fc",
    },
  });

  const leticia = await prisma.profissional.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "leticia@lbbeautyclinic.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Letícia Bordin",
      email: "leticia@lbbeautyclinic.com",
      especialidade: "Unhas",
      tipoComissao: "PERCENTUAL",
      percentualComissao: 65,
      cor: "#34d399",
    },
  });

  console.log("✅ Profissionais criados");

  // Usuário admin (Anderson)
  const anderson = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "anderson@lbbeautyclinic.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Anderson",
      email: "anderson@lbbeautyclinic.com",
      senhaHash: await bcrypt.hash("admin123", 10),
      permissoes: {
        create: {
          isAdmin: true,
          verAgenda: true,
          realizarAgendamentos: true,
          verContatoCliente: true,
          verValoresServicos: true,
          acessarClientes: true,
          acessarServicos: true,
          acessarProdutos: true,
          acessarDespesas: true,
          acessarFinanceiro: true,
          verComissoesReceber: true,
          verPagamentosComissao: true,
          acessarProntuarios: true,
          acessarRelatorios: true,
        },
      },
    },
  });

  // Usuário Dra. Lunna
  await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "lunna@lbbeautyclinic.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Dra. Lunna Bordin",
      email: "lunna@lbbeautyclinic.com",
      senhaHash: await bcrypt.hash("lunna123", 10),
      profissionalId: lunna.id,
      permissoes: {
        create: {
          isAdmin: false,
          verAgenda: true,
          realizarAgendamentos: true,
          verContatoCliente: true,
          verValoresServicos: true,
          acessarClientes: true,
          acessarServicos: true,
          acessarProntuarios: true,
          acessarRelatorios: true,
        },
      },
    },
  });

  // Usuário Beatriz
  await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "beatriz@lbbeautyclinic.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Beatriz de Lima",
      email: "beatriz@lbbeautyclinic.com",
      senhaHash: await bcrypt.hash("beatriz123", 10),
      profissionalId: beatriz.id,
      permissoes: {
        create: {
          isAdmin: false,
          verAgenda: true,
          realizarAgendamentos: true,
          verContatoCliente: false,
          verValoresServicos: true,
          acessarServicos: true,
        },
      },
    },
  });

  // Usuário Letícia
  await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "leticia@lbbeautyclinic.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Letícia Bordin",
      email: "leticia@lbbeautyclinic.com",
      senhaHash: await bcrypt.hash("leticia123", 10),
      profissionalId: leticia.id,
      permissoes: {
        create: {
          isAdmin: false,
          verAgenda: true,
          realizarAgendamentos: true,
          verContatoCliente: true,
          verValoresServicos: true,
          acessarServicos: true,
          acessarProdutos: true,
          acessarDespesas: true,
          verComissoesReceber: true,
          verPagamentosComissao: true,
        },
      },
    },
  });

  console.log("✅ Usuários criados");

  // Serviços (51 serviços da LB Beauty Clinic)
  const servicos = [
    // Procedimentos Dra. Lunna
    { nome: "Botox", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 60, preco: 650 },
    { nome: "Microagulhamento", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 90, preco: 350 },
    { nome: "PEIM", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 30, preco: 0, precoVariavel: true },
    { nome: "Preenchimento Facial", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 60, preco: 0, precoVariavel: true },
    { nome: "Bioestimuladores de Colágeno", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 60, preco: 0, precoVariavel: true },
    { nome: "Skinbooster", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 60, preco: 0, precoVariavel: true },
    { nome: "Fios de PDO", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 60, preco: 0, precoVariavel: true },
    { nome: "Peeling Químico", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 60, preco: 0, precoVariavel: true },
    { nome: "Intradermoterapia", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 60, preco: 0, precoVariavel: true },
    { nome: "Enzimas", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 60, preco: 0, precoVariavel: true },
    { nome: "Rinomodelação", categoria: "Procedimentos Dra. Lunna", cor: "#B89968", duracaoMin: 60, preco: 0, precoVariavel: true },
    // Avaliação e Retorno
    { nome: "Avaliação", categoria: "Avaliação e Retorno", cor: "#94a3b8", duracaoMin: 60, preco: 50 },
    { nome: "Retorno", categoria: "Avaliação e Retorno", cor: "#94a3b8", duracaoMin: 30, preco: 0 },
    { nome: "Modelo", categoria: "Avaliação e Retorno", cor: "#94a3b8", duracaoMin: 180, preco: 50 },
    // Cílios — Aplicação (Beatriz)
    { nome: "Volume Brasileiro", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 170, custoMaterial: 20 },
    { nome: "Volume Brasileiro Marrom", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 170, custoMaterial: 20 },
    { nome: "Volume Egípcio", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 150, preco: 170 },
    { nome: "Volume Russo", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 210, custoMaterial: 20 },
    { nome: "Volume Híbrido", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 170, custoMaterial: 20 },
    { nome: "Volume Glamour", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 180 },
    { nome: "Mega Volume", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 230, custoMaterial: 20 },
    { nome: "Fox Eyes", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 190 },
    { nome: "Aplicação Fox", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 180 },
    { nome: "Aplicação Volume Egípcio", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 180 },
    { nome: "Aplicação Volume Brasileiro", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 160 },
    { nome: "Efeito Molhado", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 60, preco: 160, custoMaterial: 20 },
    { nome: "Efeito Rímel", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 70, preco: 180 },
    { nome: "Efeito Sirena", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 90, preco: 140 },
    { nome: "Fio a Fio", categoria: "Cílios — Aplicação", cor: "#c084fc", duracaoMin: 60, preco: 140, custoMaterial: 20 },
    // Cílios — Manutenção
    { nome: "Manutenção Volume Brasileiro", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 60, preco: 100, custoMaterial: 15 },
    { nome: "Manutenção Volume Brasileiro Marrom", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 90, preco: 100 },
    { nome: "Manutenção Volume Egípcio", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 90, preco: 100 },
    { nome: "Manutenção Volume Russo", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 60, preco: 120, custoMaterial: 15 },
    { nome: "Manutenção Volume Híbrido", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 60, preco: 100, custoMaterial: 15 },
    { nome: "Manutenção Volume Glamour", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 65, preco: 120 },
    { nome: "Manutenção Mega Volume", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 90, preco: 140, custoMaterial: 20 },
    { nome: "Manutenção Fox Eyes", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 90, preco: 100 },
    { nome: "Manutenção Efeito Molhado", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 60, preco: 90, custoMaterial: 15 },
    { nome: "Manutenção Efeito Rímel", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 60, preco: 120 },
    { nome: "Manutenção Fio a Fio", categoria: "Cílios — Manutenção", cor: "#c084fc", duracaoMin: 60, preco: 70, custoMaterial: 15 },
    // Cílios — Outros
    { nome: "Lash Lift", categoria: "Cílios — Outros", cor: "#c084fc", duracaoMin: 70, preco: 160 },
    { nome: "Remoção de Cílios", categoria: "Cílios — Outros", cor: "#c084fc", duracaoMin: 30, preco: 0 },
    // Sobrancelha (Beatriz)
    { nome: "Aplicação de Henna", categoria: "Sobrancelha", cor: "#f59e0b", duracaoMin: 15, preco: 30 },
    { nome: "Design de Sobrancelha", categoria: "Sobrancelha", cor: "#f59e0b", duracaoMin: 40, preco: 40 },
    { nome: "Brown Lamination", categoria: "Sobrancelha", cor: "#f59e0b", duracaoMin: 50, preco: 120 },
    // Depilação
    { nome: "Buço", categoria: "Depilação", cor: "#6ee7b7", duracaoMin: 10, preco: 10 },
    // Estética Facial
    { nome: "Limpeza da Pele", categoria: "Estética Facial", cor: "#67e8f9", duracaoMin: 50, preco: 100 },
    // Corporal / Massagem
    { nome: "Drenagem Linfática", categoria: "Corporal / Massagem", cor: "#a78bfa", duracaoMin: 60, preco: 100 },
    { nome: "Massagem Relaxante", categoria: "Corporal / Massagem", cor: "#a78bfa", duracaoMin: 60, preco: 140 },
    { nome: "Ventosa", categoria: "Corporal / Massagem", cor: "#a78bfa", duracaoMin: 40, preco: 90 },
    // Unhas (Letícia)
    { nome: "Aplicação Simples Unha", categoria: "Unhas", cor: "#34d399", duracaoMin: 120, preco: 170 },
    { nome: "Aplicação Unha Decorada", categoria: "Unhas", cor: "#34d399", duracaoMin: 120, preco: 190 },
    { nome: "Banho de Gel", categoria: "Unhas", cor: "#34d399", duracaoMin: 90, preco: 100 },
    { nome: "Esmaltação em Gel", categoria: "Unhas", cor: "#34d399", duracaoMin: 30, preco: 70 },
    { nome: "Manutenção Unha 15 dias", categoria: "Unhas", cor: "#34d399", duracaoMin: 90, preco: 80 },
    { nome: "Manutenção Unha Decorada", categoria: "Unhas", cor: "#34d399", duracaoMin: 90, preco: 150 },
    { nome: "Manutenção Unha Simples", categoria: "Unhas", cor: "#34d399", duracaoMin: 90, preco: 130 },
    { nome: "Trocar Esmalte", categoria: "Unhas", cor: "#34d399", duracaoMin: 30, preco: 50 },
    { nome: "Remoção de Unha", categoria: "Unhas", cor: "#34d399", duracaoMin: 30, preco: 40 },
    { nome: "Remoção Esmaltação", categoria: "Unhas", cor: "#34d399", duracaoMin: 30, preco: 20 },
    // Combos
    { nome: "Combo Vol. Brasileiro + Sobrancelha", categoria: "Combos", cor: "#f97316", duracaoMin: 120, preco: 170 },
    // Interno
    { nome: "Reunião", categoria: "Interno", cor: "#6b7280", duracaoMin: 60, preco: 0.01 },
  ] as const;

  let servicosCriados = 0;
  for (const s of servicos) {
    const existe = await prisma.servico.findFirst({
      where: { tenantId: tenant.id, nome: s.nome },
    });
    if (!existe) {
      await prisma.servico.create({
        data: {
          tenantId: tenant.id,
          nome: s.nome,
          categoria: s.categoria,
          cor: s.cor,
          duracaoMin: s.duracaoMin,
          preco: s.preco,
          precoVariavel: ("precoVariavel" in s && s.precoVariavel) ? true : false,
          custoMaterial: ("custoMaterial" in s ? (s as { custoMaterial?: number }).custoMaterial : undefined) ?? null,
        },
      });
      servicosCriados++;
    }
  }
  console.log(`✅ ${servicosCriados} serviços criados (${servicos.length - servicosCriados} já existiam)`);

  console.log("");
  console.log("🔑 Credenciais de acesso:");
  console.log("  Admin:   anderson@lbbeautyclinic.com / admin123");
  console.log("  Lunna:   lunna@lbbeautyclinic.com / lunna123");
  console.log("  Beatriz: beatriz@lbbeautyclinic.com / beatriz123");
  console.log("  Letícia: leticia@lbbeautyclinic.com / leticia123");
  console.log("");
  console.log("🎉 Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
