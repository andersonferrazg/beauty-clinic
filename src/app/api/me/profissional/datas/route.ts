import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao();
  const profId = sessao.profissionalId;
  if (!profId) return NextResponse.json({ erro: "Apenas profissionais." }, { status: 403 });

  const datas = await prisma.disponibilidadeData.findMany({
    where: { profissionalId: profId, tenantId: sessao.tenantId },
    orderBy: { data: "asc" },
  });

  return NextResponse.json(datas);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const profId = sessao.profissionalId;
  if (!profId) return NextResponse.json({ erro: "Apenas profissionais." }, { status: 403 });

  const body = await req.json();
  const { data, tipo, horaInicio, horaFim, horaInicio2, horaFim2 } = body as {
    data: string;
    tipo: "DISPONIVEL" | "BLOQUEADO";
    horaInicio?: number;
    horaFim?: number;
    horaInicio2?: number;
    horaFim2?: number;
  };

  if (!data || !tipo) return NextResponse.json({ erro: "data e tipo são obrigatórios." }, { status: 400 });

  const dataRef = new Date(`${data}T12:00:00`);

  const registro = await prisma.disponibilidadeData.upsert({
    where: { profissionalId_data: { profissionalId: profId, data: dataRef } },
    create: {
      tenantId: sessao.tenantId,
      profissionalId: profId,
      data: dataRef,
      tipo,
      horaInicio: tipo === "DISPONIVEL" ? horaInicio ?? null : null,
      horaFim: tipo === "DISPONIVEL" ? horaFim ?? null : null,
      horaInicio2: tipo === "DISPONIVEL" ? horaInicio2 ?? null : null,
      horaFim2: tipo === "DISPONIVEL" ? horaFim2 ?? null : null,
    },
    update: {
      tipo,
      horaInicio: tipo === "DISPONIVEL" ? horaInicio ?? null : null,
      horaFim: tipo === "DISPONIVEL" ? horaFim ?? null : null,
      horaInicio2: tipo === "DISPONIVEL" ? horaInicio2 ?? null : null,
      horaFim2: tipo === "DISPONIVEL" ? horaFim2 ?? null : null,
    },
  });

  return NextResponse.json(registro, { status: 201 });
}
