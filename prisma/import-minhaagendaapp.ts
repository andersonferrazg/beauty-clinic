/**
 * Importa clientes, produtos e serviços exportados do minhaagendaapp
 * Uso:
 *   DATABASE_URL="postgresql://..." npx tsx prisma/import-minhaagendaapp.ts
 * Ou para importar apenas um tipo:
 *   ... npx tsx prisma/import-minhaagendaapp.ts clientes
 *   ... npx tsx prisma/import-minhaagendaapp.ts produtos
 *   ... npx tsx prisma/import-minhaagendaapp.ts servicos
 */

import * as XLSX from "xlsx";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BASE = path.join(__dirname, "../../");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePreco(v: string): number {
  if (!v) return 0;
  // "R$ 1.230,50" → 1230.50
  return parseFloat(v.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
}

function parseDuracao(v: string): number {
  if (!v) return 60;
  v = v.trim();
  const soMin = v.match(/^(\d+)\s*min/i);
  if (soMin) return parseInt(soMin[1]);
  const soH = v.match(/^(\d+)\s*h$/i);
  if (soH) return parseInt(soH[1]) * 60;
  const hMin = v.match(/^(\d+)\s*h\s*(\d+)\s*min/i);
  if (hMin) return parseInt(hMin[1]) * 60 + parseInt(hMin[2]);
  return 60;
}

function parseData(v: string | number | undefined): Date | null {
  if (!v) return null;
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const s = String(v).trim();
  if (!s || s === "0") return null;
  // DD/MM/YYYY
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return new Date(parseInt(br[3]), parseInt(br[2]) - 1, parseInt(br[1]));
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  return null;
}

function limpar(v: unknown): string {
  return v ? String(v).trim() : "";
}

// ─── Leitura dos arquivos Excel ───────────────────────────────────────────────

function lerExcel(arquivo: string): Record<string, unknown>[] {
  const caminho = path.join(BASE, arquivo);
  const wb = XLSX.readFile(caminho);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

// ─── Importações ─────────────────────────────────────────────────────────────

async function importarClientes(tenantId: string) {
  const rows = lerExcel(
    "BaseDeClientes_GeradoAs14-05-26_08_29_34.xlsx"
  );
  console.log(`\n📋 ${rows.length} clientes encontrados`);

  let criados = 0;
  let pulados = 0;

  for (const row of rows) {
    const nome = limpar(row["Nome"]);
    if (!nome) { pulados++; continue; }

    const telefone1 = limpar(row["Telefone"]).replace(/\D/g, "") || null;
    const telefone2 = limpar(row["Telefone 2"]).replace(/\D/g, "") || null;
    const email = limpar(row["Email"]).toLowerCase() || null;
    const endereco = limpar(row["Endereço"]) || null;
    const observacao = limpar(row["Observação / Referência"]) || null;
    const cpf = limpar(row["CPF"]).replace(/\D/g, "") || null;
    const dataNascimento = parseData(row["Data Nascimento"] as string | number);

    // Evita duplicatas pelo nome + telefone
    const existe = await prisma.cliente.findFirst({
      where: { tenantId, nome, telefone1: telefone1 ?? undefined },
    });
    if (existe) { pulados++; continue; }

    await prisma.cliente.create({
      data: {
        tenantId,
        nome,
        telefone1,
        telefone2,
        email,
        endereco,
        observacao,
        cpf,
        dataNascimento,
        ativo: true,
      },
    });
    criados++;
    if (criados % 50 === 0) process.stdout.write(`  ${criados}...`);
  }

  console.log(`\n✅ Clientes: ${criados} importados, ${pulados} pulados (duplicatas ou sem nome)`);
}

async function importarProdutos(tenantId: string) {
  const rows = lerExcel(
    "ProdutosEstoque_GeradoAs14-05-26_09_09_08.xlsx"
  );
  console.log(`\n📦 ${rows.length} produtos encontrados`);

  let criados = 0;
  let pulados = 0;

  for (const row of rows) {
    const nome = limpar(row["Produto"]);
    if (!nome) { pulados++; continue; }

    const categoria = limpar(row["Categoria"]) || null;
    const precoVendaStr = limpar(row["Preço de Venda"]);
    const qtdStr = limpar(row["Quantidade em Estoque"]);

    const precoVenda = parsePreco(precoVendaStr);
    const qtdEstoque = parseInt(qtdStr.replace(/\D/g, "")) || 0;

    const existe = await prisma.produto.findFirst({ where: { tenantId, nome } });
    if (existe) { pulados++; continue; }

    await prisma.produto.create({
      data: { tenantId, nome, categoria, precoVenda, qtdEstoque, ativo: true },
    });
    criados++;
  }

  console.log(`✅ Produtos: ${criados} importados, ${pulados} pulados`);
}

async function importarServicos(tenantId: string) {
  const rows = lerExcel("Serviços_GeradoAs14-05-26_11_07_35.xlsx");
  console.log(`\n💅 ${rows.length} serviços encontrados`);

  let criados = 0;
  let pulados = 0;

  for (const row of rows) {
    const nome = limpar(row["Nome"]);
    if (!nome) { pulados++; continue; }

    const duracaoMin = parseDuracao(limpar(row["Duração"]));
    const preco = parsePreco(limpar(row["Preço"]));
    const custoMaterial = parsePreco(limpar(row["Custo do Serviço"])) || null;
    const categoria = limpar(row["Categoria"]) || null;

    const existe = await prisma.servico.findFirst({ where: { tenantId, nome } });
    if (existe) { pulados++; continue; }

    await prisma.servico.create({
      data: { tenantId, nome, duracaoMin, preco, custoMaterial, categoria, ativo: true },
    });
    criados++;
  }

  console.log(`✅ Serviços: ${criados} importados, ${pulados} pulados`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: "lb-beauty-clinic" } });
  if (!tenant) throw new Error("Tenant 'lb-beauty-clinic' não encontrado. Rode o seed primeiro.");
  console.log(`🏥 Tenant: ${tenant.nome} (${tenant.id})`);

  const alvo = process.argv[2]?.toLowerCase();

  if (!alvo || alvo === "clientes") await importarClientes(tenant.id);
  if (!alvo || alvo === "produtos") await importarProdutos(tenant.id);
  if (!alvo || alvo === "servicos") await importarServicos(tenant.id);

  console.log("\n🎉 Importação concluída!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
