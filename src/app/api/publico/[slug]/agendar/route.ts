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

  const { servicoId, profissionalId, inicio, nome, telefone, email, cpf, dataNascimento } = body as {
    servicoId: string;
    profissionalId: string;
    inicio: string;
    nome: string;
    telefone: string;
    email?: string;
    cpf?: string;
    dataNascimento?: string;
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
          emailNotificacoes: true,
        },
      },
    },
  });

  if (!tenant || !tenant.configuracoes?.agendamentoOnlineAtivo) {
    return NextResponse.json({ erro: "Agendamento online indisponível." }, { status: 403 });
  }

  const [servico, profissional] = await Promise.all([
    prisma.servico.findFirst({
      where: { id: servicoId, tenantId: tenant.id, ativo: true, disponivelOnline: true },
      select: { id: true, nome: true, duracaoMin: true },
    }),
    prisma.profissional.findFirst({
      where: { id: profissionalId, tenantId: tenant.id, ativo: true, agendamentoOnlineAtivo: true },
      select: { id: true, nome: true, emailNotificacoes: true },
    }),
  ]);
  if (!servico) return NextResponse.json({ erro: "Serviço não encontrado." }, { status: 404 });
  if (!profissional) return NextResponse.json({ erro: "Profissional não disponível." }, { status: 404 });

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
  const cpfNumeros = cpf ? cpf.replace(/\D/g, "") : null;
  const nascimento = dataNascimento ? new Date(dataNascimento + "T12:00:00") : null;

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
        cpf: cpfNumeros || null,
        dataNascimento: nascimento,
      },
    });
  } else {
    // Atualizar campos vazios da cliente existente
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        ...(cpfNumeros && !cliente.cpf ? { cpf: cpfNumeros } : {}),
        ...(nascimento && !cliente.dataNascimento ? { dataNascimento: nascimento } : {}),
        ...(email?.trim() && !cliente.email ? { email: email.trim() } : {}),
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
      descricao: `${servico.nome} com ${profissional.nome} em ${dataFormatada} às ${horaFormatada}`,
      linkRelativo: `/agenda?data=${inicioDate.toISOString().slice(0, 10)}&abrir=${agendamento.id}`,
    },
  });

  // Enviar e-mail de notificação (profissional tem prioridade sobre e-mail da clínica)
  const emailDestino = profissional.emailNotificacoes || tenant.configuracoes?.emailNotificacoes;
  if (emailDestino) {
    try {
      const { enviarEmail } = await import("@/lib/email");
      await enviarEmail({
        para: emailDestino,
        assunto: `Nova solicitação de agendamento: ${nome.trim()}`,
        html: `
          <p>Olá!</p>
          <p>Uma nova solicitação de agendamento foi recebida:</p>
          <ul>
            <li><strong>Cliente:</strong> ${nome.trim()}</li>
            <li><strong>Telefone:</strong> ${telefone}</li>
            ${email ? `<li><strong>E-mail:</strong> ${email}</li>` : ""}
            <li><strong>Serviço:</strong> ${servico.nome}</li>
            <li><strong>Profissional:</strong> ${profissional.nome}</li>
            <li><strong>Data/hora:</strong> ${dataFormatada} às ${horaFormatada}</li>
          </ul>
          <p>Acesse o sistema para confirmar o agendamento.</p>
        `,
      });
    } catch {
      // Falha no e-mail não bloqueia o agendamento
    }
  }

  return NextResponse.json({ ok: true, agendamentoId: agendamento.id }, { status: 201 });
}
