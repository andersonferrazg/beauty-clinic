import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { criarCookieSessao, PERMISSOES_VAZIAS, type Permissoes } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json({ erro: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { email: email.toLowerCase().trim(), ativo: true },
      include: {
        permissoes: true,
        profissional: { select: { id: true, nome: true, avatarUrl: true } },
        tenant: { select: { id: true, nome: true, slug: true, corPrimaria: true } },
      },
    });

    if (!usuario) {
      return NextResponse.json({ erro: "Email ou senha incorretos." }, { status: 401 });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);

    if (!senhaCorreta) {
      return NextResponse.json({ erro: "Email ou senha incorretos." }, { status: 401 });
    }

    const permissoes: Permissoes = usuario.permissoes
      ? {
          isAdmin: usuario.permissoes.isAdmin,
          verAgenda: usuario.permissoes.verAgenda,
          realizarAgendamentos: usuario.permissoes.realizarAgendamentos,
          verContatoCliente: usuario.permissoes.verContatoCliente,
          verValoresServicos: usuario.permissoes.verValoresServicos,
          acessarClientes: usuario.permissoes.acessarClientes,
          acessarServicos: usuario.permissoes.acessarServicos,
          acessarProdutos: usuario.permissoes.acessarProdutos,
          acessarDespesas: usuario.permissoes.acessarDespesas,
          acessarFinanceiro: usuario.permissoes.acessarFinanceiro,
          verComissoesReceber: usuario.permissoes.verComissoesReceber,
          verComissoesPagar: (usuario.permissoes as Record<string, unknown>).verComissoesPagar === true,
          marcarComissaoPaga: (usuario.permissoes as Record<string, unknown>).marcarComissaoPaga === true,
          verPagamentosComissao: usuario.permissoes.verPagamentosComissao,
          acessarProntuarios: usuario.permissoes.acessarProntuarios,
          acessarRelatorios: usuario.permissoes.acessarRelatorios,
          acessarConfiguracoesTaxas: (usuario.permissoes as Record<string, unknown>).acessarConfiguracoesTaxas === true,
          acessarNotasFiscais: (usuario.permissoes as Record<string, unknown>).acessarNotasFiscais === true,
        }
      : PERMISSOES_VAZIAS;

    const sessao = {
      usuarioId: usuario.id,
      tenantId: usuario.tenantId,
      nome: usuario.nome,
      email: usuario.email,
      profissionalId: usuario.profissionalId ?? null,
      permissoes,
    };

    const cookieStore = await cookies();
    cookieStore.set("sessao", criarCookieSessao(sessao), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ ok: true, usuario: sessao });
  } catch (e) {
    console.error("[login]", e);
    return NextResponse.json(
      { erro: "Erro interno do servidor: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
