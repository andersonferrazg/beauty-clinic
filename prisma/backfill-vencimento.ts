/**
 * Backfill — Correção dos lançamentos de atendimento de junho/2026.
 *
 * Problema 1: lançamentos com vencimento=null → usa data de gravação, não do atendimento.
 * Problema 2: agendamentos com status contaConfirmado=false (ex: "Confirmado") que foram
 *             erroneamente finalizados e têm lancamentos reais — devem ser revertidos.
 *
 * Executar APÓS rodar o seed atualizado (que flipa "Confirmado" para contaConfirmado=false).
 *
 * Uso:
 *   npx tsx prisma/backfill-vencimento.ts
 *   (com DATABASE_URL apontando para o banco alvo — local ou produção)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, nome: true } });
  console.log(`Tenants encontrados: ${tenants.map(t => t.nome).join(", ")}`);

  for (const tenant of tenants) {
    console.log(`\n=== Tenant: ${tenant.nome} ===`);
    await processarTenant(tenant.id);
  }
}

async function processarTenant(tenantId: string) {
  // ─── Passo 1: Reverter agendamentos incorretamente finalizados ───────────────
  // Agendamentos com dataRealizado (foram "finalizados") mas cujo STATUS atual
  // tem contaConfirmado=false (ex: "Confirmado") — significa que o gatilho errado
  // criou a receita.
  const incorretos = await prisma.agendamento.findMany({
    where: {
      tenantId,
      dataRealizado: { not: null },
      status: { contaConfirmado: false },
    },
    include: {
      status: { select: { nome: true, contaConfirmado: true } },
      lancamento: true,
    },
  });

  if (incorretos.length > 0) {
    console.log(`\n[Passo 1] ${incorretos.length} agendamento(s) incorretamente finalizado(s):`);
    for (const ag of incorretos) {
      console.log(`  → ${ag.id} | status: ${ag.status?.nome} | lancamento: ${ag.lancamentoId ?? "nenhum"}`);

      const lancId = ag.lancamentoId;

      // Verificar se há comissões já pagas (não pode reverter nesses casos)
      if (lancId) {
        const comissoesPagas = await prisma.comissaoLancamento.count({
          where: { lancamentoId: lancId, pago: true },
        });
        if (comissoesPagas > 0) {
          console.log(`    ⚠️  PULANDO: há ${comissoesPagas} comissão(ões) paga(s) — reverter manualmente.`);
          continue;
        }
      }

      await prisma.$transaction(async (tx) => {
        // Devolver estoque (movimentações de saída)
        const movs = await tx.movimentacaoEstoque.findMany({
          where: { agendamentoId: ag.id, tipo: "SAIDA", tenantId },
        });
        for (const mov of movs) {
          await tx.produto.update({
            where: { id: mov.produtoId },
            data: { qtdEstoque: { increment: mov.quantidade } },
          });
        }
        await tx.movimentacaoEstoque.deleteMany({ where: { agendamentoId: ag.id, tenantId } });

        // Desvincula agendamento
        await tx.agendamento.update({
          where: { id: ag.id },
          data: { dataRealizado: null, lancamentoId: null },
        });

        // Remove lançamento + comissões
        if (lancId) {
          await tx.comissaoLancamento.deleteMany({ where: { lancamentoId: lancId } });
          await tx.lancamento.delete({ where: { id: lancId } });
        }
      });

      console.log(`    ✅ Revertido com sucesso.`);
    }
  } else {
    console.log("[Passo 1] Nenhum agendamento incorretamente finalizado.");
  }

  // ─── Passo 2: Corrigir vencimento=null dos lançamentos legítimos ─────────────
  // Lançamentos de atendimento sem data → setar vencimento = data do atendimento
  const agendamentosComLancamentoSemData = await prisma.agendamento.findMany({
    where: {
      tenantId,
      lancamentoId: { not: null },
      lancamento: { vencimento: null, origem: "AUTO_ATENDIMENTO" },
    },
    include: {
      lancamento: { select: { id: true, descricao: true, valor: true, vencimento: true } },
    },
  });

  if (agendamentosComLancamentoSemData.length > 0) {
    console.log(`\n[Passo 2] ${agendamentosComLancamentoSemData.length} lançamento(s) sem vencimento para corrigir:`);
    for (const ag of agendamentosComLancamentoSemData) {
      const dataAtendimento = ag.inicio;
      console.log(`  → lancamento ${ag.lancamentoId} | ${ag.lancamento?.descricao} | data: ${dataAtendimento.toISOString().slice(0, 10)}`);

      await prisma.lancamento.update({
        where: { id: ag.lancamentoId! },
        data: { vencimento: dataAtendimento },
      });
      console.log(`    ✅ vencimento corrigido para ${dataAtendimento.toISOString().slice(0, 10)}`);
    }
  } else {
    console.log("[Passo 2] Nenhum lançamento com vencimento=null encontrado.");
  }

  console.log("\n✅ Backfill concluído.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
