import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();

  const status = await prisma.statusAgenda.findMany({
    where: { tenantId: sessao.tenantId },
    orderBy: { ordem: "asc" },
  });

  return NextResponse.json(status);
}
