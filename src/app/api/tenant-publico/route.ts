import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { iniciaisDoNome } from "@/lib/iniciais";

/**
 * Endpoint público (sem sessão) que retorna identidade visual do tenant principal.
 *
 * Hoje (single-tenant por instância): retorna o primeiro tenant ativo do banco.
 * Quando virar multi-tenant via subdomínio: resolver pelo host/slug.
 *
 * Usado em telas pré-login (Login) e no chrome do app (Sidebar, ícone PWA).
 */
export async function GET() {
  const tenant = await prisma.tenant.findFirst({
    where: { ativo: true },
    orderBy: { criadoEm: "asc" },
    select: { id: true, nome: true, logoUrl: true, corPrimaria: true, corSecundaria: true },
  });

  if (!tenant) {
    return NextResponse.json({
      nome: "Beauty Clinic",
      iniciais: "BC",
      logoUrl: null,
      corPrimaria: "#B89968",
      corSecundaria: "#E8DCC4",
    });
  }

  return NextResponse.json({
    nome: tenant.nome,
    iniciais: iniciaisDoNome(tenant.nome),
    logoUrl: tenant.logoUrl,
    corPrimaria: tenant.corPrimaria,
    corSecundaria: tenant.corSecundaria,
  });
}
