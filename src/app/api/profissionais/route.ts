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
  // Se isAdmin, liga tudo
  if (base.isAdmin) {
    for (const k of PERMISSOES_KEYS) base[k] = true;
  }
  return base;
}

export async function GET() {
  const sessao = await exigirSessao();

  const profissionais = await prisma.profissional.findMany({
    where: { tenantId: sessao.tenantId, ativo: true },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      especialidade: true,
      cor: true,
      tipoComissao: true,
      percentualComissao: true,
      salarioFixo: true,
      whatsappAtivo: true,
      registro: true,
      cpf: true,
      cnpj: true,
      direcaoComissao: true,
      possuiAgenda: true,
      profissionalTerceiro: true,
    },
  });

  return NextResponse.json(profissionais);
}

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  const body = await req.json();

  if (!body.nome || typeof body.nome !== "string") {
    return NextResponse.json({ erro: "Nome é obrigatório." }, { status: 400 });
  }

  const criarLogin = body.criarLogin !== false; // padrão: cria login
  const loginEmail: string | null = criarLogin ? (body.loginEmail || "").trim().toLowerCase() : null;
  const senha: string | null = criarLogin ? (body.senha || "") : null;

  if (criarLogin) {
    if (!loginEmail) return NextResponse.json({ erro: "E-mail de login é obrigatório." }, { status: 400 });
    if (!senha) return NextResponse.json({ erro: "Senha é obrigatória." }, { status: 400 });
    if (senha.length < 4) return NextResponse.json({ erro: "Senha deve ter ao menos 4 caracteres." }, { status: 400 });
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { tenantId: sessao.tenantId, email: loginEmail },
    });
    if (usuarioExistente) {
      return NextResponse.json({ erro: "Já existe um usuário com esse e-mail nesta clínica." }, { status: 400 });
    }
  }

  try {
    const profissional = await prisma.$transaction(async (tx) => {
      const prof = await tx.profissional.create({
        data: {
          tenantId: sessao.tenantId,
          nome: body.nome,
          email: body.email ?? null,
          telefone: body.telefone ?? null,
          especialidade: body.especialidade ?? null,
          registro: body.registro ?? null,
          cpf: body.cpf ?? null,
          cnpj: body.cnpj ?? null,
          cor: body.cor ?? "#B89968",
          tipoComissao: body.tipoComissao ?? "PERCENTUAL",
          percentualComissao: body.percentualComissao ? Number(body.percentualComissao) : null,
          salarioFixo: body.salarioFixo ? Number(body.salarioFixo) : null,
          direcaoComissao: body.direcaoComissao ?? "CLINICA_PAGA",
          frequenciaComissao: body.frequenciaComissao ?? "MENSAL",
          possuiAgenda: body.possuiAgenda !== false,
          profissionalTerceiro: !!body.profissionalTerceiro,
        },
      });

      if (criarLogin) {
        const senhaHash = await bcrypt.hash(senha as string, 10);
        const permissoes = montarPermissoes(body.permissoes);
        await tx.usuario.create({
          data: {
            tenantId: sessao.tenantId,
            nome: body.nome,
            email: loginEmail as string,
            senhaHash,
            profissionalId: prof.id,
            permissoes: { create: permissoes },
          },
        });
      }

      return prof;
    });

    return NextResponse.json(profissional, { status: 201 });
  } catch (e) {
    console.error("[POST /api/profissionais]", e);
    return NextResponse.json(
      { erro: "Erro ao criar profissional: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
