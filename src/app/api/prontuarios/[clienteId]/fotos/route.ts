import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissao } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ clienteId: string }> }) {
  const sessao = await exigirPermissao("acessarProntuarios");
  await params; // clienteId não é usado diretamente mas valida a rota

  const body = await req.json();
  // body: { procedimentoId, url, tag, descricao }

  const foto = await prisma.foto.create({
    data: {
      tenantId: sessao.tenantId,
      procedimentoId: body.procedimentoId,
      url: body.url,
      tag: body.tag, // antes | durante | depois
      descricao: body.descricao ?? null,
    },
  });

  return NextResponse.json(foto, { status: 201 });
}
