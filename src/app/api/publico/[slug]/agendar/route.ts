import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Rate limit: 5 tentativas por hora por IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!verificarRateLimit(`agendar:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ erro: "Muitas tentativas. Tente novamente em 1 hora." }, { status: 429 });
  }

  const body = await req.json();

  // Honeypot anti-bot
  if (body.website) {
    return NextResponse.json({ erro: "Inválido." }, { status: 400 });
  }

  const { servicoId, profissionalId, inicio, nome, telefone, email } = body as {
    servicoId: string;
    profissionalId: string;
    inicio: string;
    nome: string;
    telefone: string;
    email?: string;
  };

  if (!servicoId || !profissionalId || !inicio || !nome || !telefone) {
    return NextResponse.json({ erro: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  // Validar telefone BR
  const telNumeros = telefone.replace(/\D/g, "");
  if (telNumeros.length < 10 || telNumeros.length > 11) {
    return NextResponse.json({ erro: "Telefone inválido." }, { status: 400 });
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
    return NextResponse.json({ erro: "Agendamento online indisponível." }, { status: 403 });
  }

  const servico = await prisma.servico.findFirst({
    where: { id: servicoId, tenantId: tenant.id, ativo: true, disponivelOnline: true },
    select: { id: true, nome: true, duracaoMin: true },
  });
  if (!servico) return NextResponse.json({ erro: "Serviço não encontrado." }, { status: 404 });

  const inicioDate = new Date(inicio);
  const fimDate = new Date(inicioDate.getTime() + servico.duracaoMin * 60_000);

  // Verificar conflito de horário
  const conflito = await prisma.agendamento.findFirst({
    where: {
      tenantId: tenant.id,
      profissionalId,
      inicio: { lt: fimDate },
      fim: { gt: inicioDate },
    },
  });
  if (conflito) {
    return NextResponse.json({ erro: "Este horário não está mais disponível. Escolha outro." }, { status: 409 });
  }

  // Buscar ou criar cliente pelo telefone
  const telBusca = telNumeros.slice(-11);
  let cliente = await prisma.cliente.findFirst({
    where: {
      tenantId: tenant.id,
      telefone1: { contains: telBusca },
      ativo: true,
    },
  });

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        nome: nome.trim(),
        telefone1: telefone,
        email: email?.trim() || null,
      },
    });
  }

  // Buscar status "À confirmar"
  const statusAConfirmar = await prisma.statusAgenda.findFirst({
    where: { tenantId: tenant.id, nome: { contains: "confirmar" } },
  });

  // Criar agendamento
  const agendamento = await prisma.agendamento.create({
    data: {
      tenantId: tenant.id,
      profissionalId,
      clienteId: cliente.id,
      statusId: statusAConfirmar?.id ?? null,
      inicio: inicioDate,
      fim: fimDate,
      origem: "online",
      itens: {
        create: [{ servicoId: servico.id, preco: 0, quantidade: 1 }],
      },
    },
  });

  // Criar notificação interna
  const dataFormatada = inicioDate.toLocaleDateString("pt-BR");
  const horaFormatada = inicioDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  await prisma.notificacaoSistema.create({
    data: {
      tenantId: tenant.id,
      tipo: "AGENDAMENTO_ONLINE",
      titulo: `Nova solicitação: ${nome.trim()}`,
      descricao: `${servico.nome} em ${dataFormatada} às ${horaFormatada}`,
      linkRelativo: `/agenda?data=${inicioDate.toISOString().slice(0, 10)}&abrir=${agendamento.id}`,
    },
  });

  return NextResponse.json({ ok: true, agendamentoId: agendamento.id }, { status: 201 });
}
