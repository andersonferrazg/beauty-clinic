import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularSlotsLivres } from "@/lib/horarios-disponiveis";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = req.nextUrl;
  const profissionalId = searchParams.get("profissionalId");
  const data = searchParams.get("data"); // "YYYY-MM-DD"
  const duracaoMin = parseInt(searchParams.get("duracaoMin") ?? "60");

  if (!profissionalId || !data) {
    return NextResponse.json({ erro: "Parâmetros obrigatórios: profissionalId, data" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug, ativo: true },
    select: {
      id: true,
      configuracoes: {
        select: {
          agendamentoOnlineAtivo: true,
          intervaloAgendaMin: true,
        },
      },
    },
  });

  if (!tenant || !tenant.configuracoes?.agendamentoOnlineAtivo) {
    return NextResponse.json({ slots: [] });
  }

  const intervaloMin = tenant.configuracoes.intervaloAgendaMin;

  // 1. Verificar se existe disponibilidade específica para essa data
  const dataRef = new Date(`${data}T12:00:00`);
  const dispData = await prisma.disponibilidadeData.findFirst({
    where: { profissionalId, tenantId: tenant.id, data: dataRef },
  });

  let periodos: { horaInicio: number; horaFim: number }[] = [];

  if (dispData) {
    if (dispData.tipo === "BLOQUEADO") {
      return NextResponse.json({ slots: [] });
    }
    // DISPONIVEL com horários específicos
    if (dispData.horaInicio != null && dispData.horaFim != null) {
      periodos.push({ horaInicio: dispData.horaInicio, horaFim: dispData.horaFim });
    }
    if (dispData.horaInicio2 != null && dispData.horaFim2 != null) {
      periodos.push({ horaInicio: dispData.horaInicio2, horaFim: dispData.horaFim2 });
    }
  } else {
    // 2. Fallback para disponibilidade recorrente semanal
    const diaSemana = dataRef.getDay();
    const dispSemana = await prisma.disponibilidadeProfissional.findUnique({
      where: { profissionalId_diaSemana: { profissionalId, diaSemana } },
    });

    if (!dispSemana) return NextResponse.json({ slots: [] });

    periodos.push({ horaInicio: dispSemana.horaInicio, horaFim: dispSemana.horaFim });
    if (dispSemana.horaInicio2 != null && dispSemana.horaFim2 != null) {
      periodos.push({ horaInicio: dispSemana.horaInicio2, horaFim: dispSemana.horaFim2 });
    }
  }

  if (periodos.length === 0) return NextResponse.json({ slots: [] });

  // Busca agendamentos existentes do dia
  const inicioDia = new Date(`${data}T00:00:00`);
  const fimDia = new Date(`${data}T23:59:59`);
  const agendamentos = await prisma.agendamento.findMany({
    where: {
      tenantId: tenant.id,
      profissionalId,
      inicio: { gte: inicioDia, lte: fimDia },
    },
    select: { inicio: true, fim: true },
  });

  const agora = new Date();
  const slots = calcularSlotsLivres({
    data,
    duracaoMin,
    periodos,
    intervaloMin,
    agendamentos,
  }).filter((slot) => {
    const slotDate = new Date(`${data}T${slot}:00`);
    return slotDate > agora;
  });

  return NextResponse.json({ slots });
}
