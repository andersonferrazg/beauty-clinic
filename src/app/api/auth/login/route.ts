import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { criarCookieSessao } from "@/lib/session";

export async function POST(req: NextRequest) {
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

  const sessao = {
    usuarioId: usuario.id,
    tenantId: usuario.tenantId,
    nome: usuario.nome,
    email: usuario.email,
    isAdmin: usuario.permissoes?.isAdmin ?? false,
    profissionalId: usuario.profissionalId ?? null,
  };

  const cookieStore = await cookies();
  cookieStore.set("sessao", criarCookieSessao(sessao), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  });

  return NextResponse.json({ ok: true, usuario: sessao });
}
