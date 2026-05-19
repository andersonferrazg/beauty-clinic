import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Gasto = { descricao: string; valor: number; dia: number };

// Dados extraídos da planilha CLINICA LB FINANCEIRO — mai/26
const gastosClinica: Gasto[] = [
  { descricao: "ALUGUEL", valor: 2870.00, dia: 5 },
  { descricao: "FEC CONT.", valor: 466.00, dia: 5 },
  { descricao: "ÁGUA", valor: 31.32, dia: 7 },
  { descricao: "BOLETO MOV.", valor: 1820.00, dia: 15 },
  { descricao: "INTERNET", valor: 96.07, dia: 15 },
  { descricao: "ENERGIA", valor: 725.88, dia: 16 },
  { descricao: "FATURA NUBANK PJ", valor: 1036.00, dia: 10 },
  { descricao: "SAN CRISTO", valor: 371.04, dia: 20 },
  { descricao: "GUIA INSS LUNNA", valor: 178.31, dia: 20 },
  { descricao: "IMPOSTO DAS", valor: 0, dia: 20 },
  { descricao: "ACORDO LUNNA MEI", valor: 129.00, dia: 31 },
  { descricao: "ACORDO LUNNA SIMPLIS", valor: 306.00, dia: 31 },
  { descricao: "CREM CLINICA", valor: 137.67, dia: 31 },
  { descricao: "CREM LUNNA", valor: 105.00, dia: 31 },
  { descricao: "ACORDO SIMPLES ANDERSON", valor: 50.83, dia: 31 },
  { descricao: "ACORDO MEI ANDERSON", valor: 26.74, dia: 31 },
];

const gastosCasa: Gasto[] = [
  { descricao: "ALUGUEL", valor: 1628.91, dia: 5 },
  { descricao: "FATURA RENNER", valor: 796.51, dia: 10 },
  { descricao: "STEFANY", valor: 250.00, dia: 20 },
  { descricao: "ENERGIA", valor: 0, dia: 10 },
  { descricao: "FATURA NUBANK FS", valor: 0, dia: 20 },
  { descricao: "INTERNET", valor: 105.00, dia: 15 },
  { descricao: "NUBANK 1/3 PARC", valor: 239.00, dia: 24 },
  { descricao: "NUBANK 2/3 PARC", valor: 211.00, dia: 24 },
  { descricao: "CELULARES", valor: 0, dia: 20 },
  { descricao: "FATURA RIACHUELO", valor: 0, dia: 10 },
];

function makeDate(ano: number, mes1: number, dia: number): Date {
  const ultimoDia = new Date(ano, mes1, 0).getDate();
  return new Date(ano, mes1 - 1, Math.min(dia, ultimoDia), 12, 0, 0);
}

async function importarMes(
  tenantId: string,
  ano: number,
  mes1: number,
  gastos: Gasto[],
  categoria: string,
  pago: boolean,
) {
  const inicioMes = new Date(ano, mes1 - 1, 1);
  const fimMes = new Date(ano, mes1, 0, 23, 59, 59);
  let criados = 0;

  for (const g of gastos) {
    const existente = await prisma.lancamento.findFirst({
      where: { tenantId, categoria, descricao: g.descricao, vencimento: { gte: inicioMes, lte: fimMes } },
    });
    if (existente) continue;

    await prisma.lancamento.create({
      data: {
        tenantId,
        tipo: "DESPESA",
        categoria,
        descricao: g.descricao,
        valor: g.valor,
        vencimento: makeDate(ano, mes1, g.dia),
        pago,
        pagoEm: pago ? new Date() : null,
      },
    });
    criados++;
  }
  return criados;
}

async function main() {
  console.log("🌱 Importando gastos da planilha financeira...");

  const tenant = await prisma.tenant.findFirst({ where: { slug: "lb-beauty-clinic" } });
  if (!tenant) throw new Error("Tenant não encontrado. Execute npm run db:seed primeiro.");

  let total = 0;

  // Maio/2026 — já pago (conforme planilha)
  total += await importarMes(tenant.id, 2026, 5, gastosClinica, "Gastos Clínica", true);
  total += await importarMes(tenant.id, 2026, 5, gastosCasa, "Gastos Casa", true);

  // Junho a Dezembro/2026 — a pagar
  for (const mes of [6, 7, 8, 9, 10, 11, 12]) {
    total += await importarMes(tenant.id, 2026, mes, gastosClinica, "Gastos Clínica", false);
    total += await importarMes(tenant.id, 2026, mes, gastosCasa, "Gastos Casa", false);
  }

  console.log(`✅ ${total} lançamentos criados (já existentes foram ignorados).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
