import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function d(ano: number, mes: number, dia: number): Date {
  const ultimo = new Date(ano, mes, 0).getDate();
  return new Date(ano, mes - 1, Math.min(dia, ultimo), 12, 0, 0);
}

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: "lb-beauty-clinic" } });
  if (!tenant) throw new Error("Tenant 'lb-beauty-clinic' não encontrado. Execute seed primeiro.");
  const tid = tenant.id;

  // Apaga todos os lançamentos de Gastos Clínica e Gastos Casa de Maio/2026
  const maioInicio = new Date(2026, 4, 1);
  const maioFim = new Date(2026, 5, 0, 23, 59, 59);

  const deletados = await prisma.lancamento.deleteMany({
    where: {
      tenantId: tid,
      categoria: { in: ["Gastos Clínica", "Gastos Casa"] },
      vencimento: { gte: maioInicio, lte: maioFim },
    },
  });
  console.log(`🗑️  ${deletados.count} lançamentos antigos de Maio/2026 removidos.`);

  // ─── GASTOS CLÍNICA — Maio 2026 ───────────────────────────────────────────
  const clinica: { descricao: string; valor: number; venc: Date; pagoEm: Date | null }[] = [
    { descricao: "ALUGUEL",                      valor: 2631.91, venc: d(2026,5, 5), pagoEm: d(2026,5,15) },
    { descricao: "PEC CONT.",                    valor:  466.00, venc: d(2026,5, 5), pagoEm: null },
    { descricao: "ÁGUA",                         valor:   31.32, venc: d(2026,5, 7), pagoEm: null },
    { descricao: "BOLETO MOV.12/12",             valor: 1820.00, venc: d(2026,5,15), pagoEm: null },
    { descricao: "INTERNET",                     valor:   96.07, venc: d(2026,5,15), pagoEm: null },
    { descricao: "ENERGIA",                      valor:  725.86, venc: d(2026,5,16), pagoEm: null },
    { descricao: "FATURA NUBANK PJ 2/3 imprest", valor:  211.91, venc: d(2026,5,18), pagoEm: d(2026,5,26) },
    { descricao: "SAN CRISTO",                   valor:  371.04, venc: d(2026,5,20), pagoEm: null },
    { descricao: "GUIA INSS LUNNA",              valor:  178.31, venc: d(2026,5,20), pagoEm: null },
    { descricao: "FATURA NUBANK PJ",             valor:  466.06, venc: d(2026,5,18), pagoEm: d(2026,5,29) },
    { descricao: "IMPOSTO DAS",                  valor:    0.00, venc: d(2026,5,20), pagoEm: null },
    { descricao: "ACORDO LUNNA MEI 5/18",        valor:  129.00, venc: d(2026,5,20), pagoEm: d(2026,5,29) },
    { descricao: "ACORDO LUNNA SIMPLIS 5/18",    valor:  306.00, venc: d(2026,5,31), pagoEm: d(2026,5,29) },
    { descricao: "CRBM CLINICA 5/6",             valor:  137.67, venc: d(2026,5,31), pagoEm: d(2026,5,29) },
    { descricao: "CRBM LUNNA 5/6",               valor:  105.00, venc: d(2026,5,31), pagoEm: d(2026,5,29) },
    { descricao: "ACORDO SIMPLES ANDERSON",      valor:   50.83, venc: d(2026,5,31), pagoEm: d(2026,5,29) },
    { descricao: "ACORDO MEI ANDERSON",          valor:   26.74, venc: d(2026,5,31), pagoEm: d(2026,5,29) },
  ];

  for (const g of clinica) {
    await prisma.lancamento.create({
      data: {
        tenantId: tid,
        tipo: "DESPESA",
        categoria: "Gastos Clínica",
        descricao: g.descricao,
        valor: g.valor,
        vencimento: g.venc,
        pago: true,
        pagoEm: g.pagoEm,
      },
    });
  }
  console.log(`✅ ${clinica.length} lançamentos de Gastos Clínica criados.`);

  // ─── GASTOS CASA — Maio 2026 ──────────────────────────────────────────────
  const casa: { descricao: string; valor: number; venc: Date | null; pagoEm: Date | null }[] = [
    { descricao: "ALUGUEL",           valor: 1647.95, venc: d(2026,5, 5), pagoEm: d(2026,5,12) },
    { descricao: "FATURA RENNER",     valor: 1264.26, venc: d(2026,5,10), pagoEm: d(2026,5,19) },
    { descricao: "STEFANY 6/8",       valor:  250.00, venc: d(2026,5,10), pagoEm: null },
    { descricao: "ENERGIA",           valor:    0.00, venc: d(2026,5,16), pagoEm: null },
    { descricao: "FATURA NUBANK FS",  valor:    0.00, venc: d(2026,5,20), pagoEm: null },
    { descricao: "INTERNET",          valor:  109.00, venc: d(2026,5,19), pagoEm: null },
    { descricao: "NUBANK 1/3 PARC",   valor:  239.00, venc: d(2026,5,24), pagoEm: null },
    { descricao: "NUBANK 2/3 PARC",   valor:  211.00, venc: d(2026,5,24), pagoEm: null },
    { descricao: "CELULARES",         valor:    0.00, venc: d(2026,5,20), pagoEm: null },
    { descricao: "FATURA RIACHUELO",  valor:    0.00, venc: d(2026,5,10), pagoEm: null },
  ];

  for (const g of casa) {
    await prisma.lancamento.create({
      data: {
        tenantId: tid,
        tipo: "DESPESA",
        categoria: "Gastos Casa",
        descricao: g.descricao,
        valor: g.valor,
        vencimento: g.venc,
        pago: true,
        pagoEm: g.pagoEm,
      },
    });
  }
  console.log(`✅ ${casa.length} lançamentos de Gastos Casa criados.`);
  console.log("🎉 Patch de Maio/2026 concluído!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
