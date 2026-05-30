import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import bcrypt from "bcryptjs";

const PERMISSOES_KEYS = [
  "isAdmin",
  "verAgenda",
  "realizarAgendamentos",
  "verContatoCliente",
  "verValoresServicos",
  "acessarClientes",
  "acessarServicos",
  "acessarProdutos",
  "acessarDespesas",
  "acessarFinanceiro",
  "verComissoesReceber",
  "verPagamentosComissao",
  "acessarProntuarios",
  "acessarRelatorios",
] as const;

type PermissaoKey = (typeof PERMISSOES_KEYS)[number];
type PermissoesInput = Partial<Record<PermissaoKey, boolean>>;

function montarPermissoes(input: PermissoesInput | undefined) {
  const base: Record<PermissaoKey, boolean> = {
    isAdmin: false,
    verAgenda: true,
    realizarAgendamentos: true,
    verContatoCliente: true,
    verValoresServicos: true,
    acessarClientes: false,
    acessarServicos: false,
    acessarProdutos: false,
    acessarDespesas: false,
    acessarFinanceiro: false,
    verComissoesReceber: false,
    verPagamentosComissao: false,
    acessarProntuarios: false,
    acessarRelatorios: false,
  };
  if (!input) return base;
  for (const k of PERMISSOES_KEYS) {
    if (typeof input[k] === "boolean") base[k] = input[k] as boolean;
  }
  if (base.isAdmin) {
    for (const k of PERMISSOES_KEYS) base[k] = true;
  }
  return base;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const profissional = await prisma.profissional.findFirst({
    where: { id, tenantId: sessao.tenantId, ativo: true },
    include: {
      usuario: {
        select: {
          id: true,
          email: true,
          permissoes: true,
        },
      },
      disponibilidades: {
        select: { diaSemana: true, horaInicio: true, horaFim: true },
        orderBy: { diaSemana: "asc" },
      },
    },
  });

  if (!profissional) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  return NextResponse.json(profissional);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const body = await req.json();

  const novoTipo: string = body.tipoComissao ?? "PERCENTUAL";
  const novoPercentual: number | null = body.percentualComissao ? Number(body.percentualComissao) : null;
  const novaDirecao: string = body.direcaoComissao ?? "CLINICA_PAGA";

  const criarLogin = body.criarLogin !== false;
  const loginEmail: string | null = criarLogin ? (body.loginEmail || "").trim().toLowerCase() : null;
  const senha: string | undefined = criarLogin && body.senha ? body.senha : undefined;

  if (criarLogin) {
    if (!loginEmail) {
      return NextResponse.json({ erro: "E-mail de login é obrigatório." }, { status: 400 });
    }
    if (senha !== undefined && senha.length < 4) {
      return NextResponse.json({ erro: "Senha deve ter ao menos 4 caracteres." }, { status: 400 });
    }
    // Verificar duplicidade de email considerando o próprio usuário
    const profExistente = await prisma.profissional.findFirst({
      where: { id, tenantId: sessao.tenantId },
      include: { usuario: true },
    });
    const usuarioConflito = await prisma.usuario.findFirst({
      where: {
        tenantId: sessao.tenantId,
        email: loginEmail,
        ...(profExistente?.usuario ? { NOT: { id: profExistente.usuario.id } } : {}),
      },
    });
    if (usuarioConflito) {
      return NextResponse.json({ erro: "Já existe outro usuário com esse e-mail nesta clínica." }, { status: 400 });
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.profissional.updateMany({
        where: { id, tenantId: sessao.tenantId },
        data: {
          nome: body.nome,
          email: body.email ?? null,
          telefone: body.telefone ?? null,
          especialidade: body.especialidade ?? null,
          registro: body.registro ?? null,
          cpf: body.cpf ?? null,
          cnpj: body.cnpj ?? null,
          cor: body.cor ?? "#B89968",
          tipoComissao: novoTipo,
          percentualComissao: novoPercentual,
          salarioFixo: body.salarioFixo ? Number(body.salarioFixo) : null,
          direcaoComissao: novaDirecao,
          frequenciaComissao: body.frequenciaComissao ?? "MENSAL",
          possuiAgenda: body.possuiAgenda !== false,
          profissionalTerceiro: !!body.profissionalTerceiro,
          agendamentoOnlineAtivo: !!body.agendamentoOnlineAtivo,
          emailNotificacoes: body.emailNotificacoes || null,
        },
      });

      // Sincronizar Usuario
      const usuarioAtual = await tx.usuario.findUnique({
        where: { profissionalId: id },
        include: { permissoes: true },
      });

      if (criarLogin) {
        const permissoes = montarPermissoes(body.permissoes);
        if (usuarioAtual) {
          // Atualiza usuario existente
          const dadosUpdate: { nome: string; email: string; senhaHash?: string } = {
            nome: body.nome,
            email: loginEmail as string,
          };
          if (senha) {
            dadosUpdate.senhaHash = await bcrypt.hash(senha, 10);
          }
          await tx.usuario.update({
            where: { id: usuarioAtual.id },
            data: dadosUpdate,
          });
          await tx.usuarioPermissao.upsert({
            where: { usuarioId: usuarioAtual.id },
            create: { usuarioId: usuarioAtual.id, ...permissoes },
            update: permissoes,
          });
        } else {
          // Cria usuario novo (era profissional sem login)
          if (!senha) {
            throw new Error("Senha é obrigatória para criar login nesta profissional.");
          }
          const senhaHash = await bcrypt.hash(senha, 10);
          await tx.usuario.create({
            data: {
              tenantId: sessao.tenantId,
              nome: body.nome,
              email: loginEmail as string,
              senhaHash,
              profissionalId: id,
              permissoes: { create: permissoes },
            },
          });
        }
      } else if (usuarioAtual) {
        // Removeu o login: desativa usuario
        await tx.usuario.update({
          where: { id: usuarioAtual.id },
          data: { ativo: false },
        });
      }

      // Sincronizar disponibilidades
      if (Array.isArray(body.disponibilidades)) {
        await tx.disponibilidadeProfissional.deleteMany({ where: { profissionalId: id } });
        const dias = body.disponibilidades as { diaSemana: number; horaInicio: number; horaFim: number }[];
        if (dias.length > 0) {
          await tx.disponibilidadeProfissional.createMany({
            data: dias.map((d) => ({
              tenantId: sessao.tenantId,
              profissionalId: id,
              diaSemana: d.diaSemana,
              horaInicio: d.horaInicio,
              horaFim: d.horaFim,
            })),
          });
        }
      }

      // Recalcula comissões pendentes (não pagas) deste profissional
      const comissoesPendentes = await tx.comissaoLancamento.findMany({
        where: { profissionalId: id, tenantId: sessao.tenantId, pago: false },
        select: { id: true, valorBase: true },
      });

      for (const c of comissoesPendentes) {
        let novoValorComissao = 0;
        let novoPercentualUsado: number | null = null;

        if (novoTipo === "INTEGRAL") {
          novoValorComissao = c.valorBase;
          novoPercentualUsado = 100;
        } else if (novoTipo === "PERCENTUAL" && novoPercentual) {
          novoValorComissao = c.valorBase * (novoPercentual / 100);
          novoPercentualUsado = novoPercentual;
        }

        if (novoValorComissao > 0) {
          await tx.comissaoLancamento.update({
            where: { id: c.id },
            data: {
              percentual: novoPercentualUsado,
              valorComissao: novoValorComissao,
              direcaoComissao: novaDirecao,
            },
          });
        } else {
          await tx.comissaoLancamento.delete({ where: { id: c.id } });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/profissionais/[id]]", e);
    return NextResponse.json(
      { erro: "Erro ao atualizar profissional: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  await prisma.profissional.updateMany({
    where: { id, tenantId: sessao.tenantId },
    data: { ativo: false },
  });

  return new NextResponse(null, { status: 204 });
}
