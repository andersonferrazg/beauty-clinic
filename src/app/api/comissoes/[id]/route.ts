import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

// PATCH /api/comissoes/[id]
// body: { valorComissao?: number, pago?: boolean, pagoEm?: string | null }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  if (!sessao.isAdmin) {
    return NextResponse.json({ erro: "Apenas administrador pode editar comissões" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const comissao = await prisma.comissaoLancamento.findFirst({
    where: { id, tenantId: sessao.tenantId },
  });

  if (!comissao) {
    return NextResponse.json({ erro: "Comissão não encontrada" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.percentual !== undefined) data.percentual = body.percentual !== null ? Number(body.percentual) : null;
  if (body.valorComissao !== undefined) data.valorComissao = Number(body.valorComissao);
  if (body.pago !== undefined) {
    data.pago = body.pago;
    data.pagoEm = body.pago ? (body.pagoEm ? new Date(body.pagoEm) : new Date()) : null;
  }

  await prisma.comissaoLancamento.update({ where: { id }, data });

  return NextResponse.json({ ok: true });
}
