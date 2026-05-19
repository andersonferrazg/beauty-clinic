// Executado automaticamente antes do build no Vercel.
// Troca o provider do schema de "sqlite" para "postgresql" quando DATABASE_PROVIDER=postgresql.
const fs = require("fs");
const path = require("path");

const provider = process.env.DATABASE_PROVIDER;
if (provider && provider !== "sqlite") {
  const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
  const schema = fs.readFileSync(schemaPath, "utf8");
  const patched = schema.replace(/provider = "sqlite"/, `provider = "${provider}"`);
  fs.writeFileSync(schemaPath, patched);
  console.log(`✅ schema.prisma: provider trocado para "${provider}"`);
}
