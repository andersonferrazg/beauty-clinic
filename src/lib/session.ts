import { cookies } from "next/headers";
import { createHmac } from "crypto";

export type Sessao = {
  usuarioId: string;
  tenantId: string;
  nome: string;
  email: string;
  isAdmin: boolean;
  profissionalId: string | null;
};

function segredo() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET não definido");
  return s;
}

function assinar(payload: string): string {
  const hmac = createHmac("sha256", segredo()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verificar(valor: string): string | null {
  const idx = valor.lastIndexOf(".");
  if (idx === -1) return null;
  const payload = valor.slice(0, idx);
  const hmac = valor.slice(idx + 1);
  const esperado = createHmac("sha256", segredo()).update(payload).digest("hex");
  if (hmac !== esperado) return null;
  return payload;
}

export async function getSessao(): Promise<Sessao | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("sessao")?.value;
  if (!raw) return null;
  try {
    const payload = verificar(raw);
    if (!payload) return null;
    return JSON.parse(payload) as Sessao;
  } catch {
    return null;
  }
}

export async function exigirSessao(): Promise<Sessao> {
  const sessao = await getSessao();
  if (!sessao) throw new Error("Não autenticado");
  return sessao;
}

export function criarCookieSessao(sessao: Sessao): string {
  return assinar(JSON.stringify(sessao));
}
