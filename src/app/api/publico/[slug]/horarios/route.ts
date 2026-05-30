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
          horaInicioAgenda: true,
          horaFimAgenda: true,
          intervaloAgendaMin: true,
        },
      },
    },
  });

  if (!tenant || !tenant.configuracoes?.agendamentoOnlineAtivo) {
    return NextResponse.json({ slots: [] });
  }

  const cfg = tenant.configuracoes;

  // Verifica disponibilidade da profissional para o dia da semana
  const diaSemana = new Date(`${data}T12:00:00`).getDay();
  const disponibilidade = await prisma.disponibilidadeProfissional.findUnique({
    where: { profissionalId_diaSemana: { profissionalId, diaSemana } },
  });

  // Se não tem disponibilidade configurada para esse dia, retorna vazio
  const horaInicio = disponibilidade?.horaInicio ?? cfg.horaInicioAgenda;
  const horaFim = disponibilidade?.horaFim ?? cfg.horaFimAgenda;
  if (!disponibilidade) return NextResponse.json({ slots: [] });

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

  // Filtra datas passadas
  const agora = new Date();
  const slots = calcularSlotsLivres({
    data,
    duracaoMin,
    horaInicio,
    horaFim,
    intervaloMin: cfg.intervaloAgendaMin,
    agendamentos,
  }).filter((slot) => {
    const [h, m] = slot.split(":").map(Number);
    const slotDate = new Date(`${data}T${slot}:00`);
    slotDate.setHours(h, m, 0, 0);
    return slotDate > agora;
  });

  return NextResponse.json({ slots });
}
