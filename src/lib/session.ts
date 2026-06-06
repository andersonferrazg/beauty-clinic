import { cookies } from "next/headers";
import { createHmac } from "crypto";

export type Permissoes = {
  isAdmin: boolean;
  verAgenda: boolean;
  realizarAgendamentos: boolean;
  verContatoCliente: boolean;
  verValoresServicos: boolean;
  acessarClientes: boolean;
  acessarServicos: boolean;
  acessarProdutos: boolean;
  acessarDespesas: boolean;
  acessarFinanceiro: boolean;
  verComissoesReceber: boolean;
  verComissoesPagar: boolean;
  marcarComissaoPaga: boolean;
  verPagamentosComissao: boolean;
  acessarProntuarios: boolean;
  acessarRelatorios: boolean;
  acessarConfiguracoesTaxas: boolean;
  acessarNotasFiscais: boolean;
  movimentarEstoque: boolean;
};

export const PERMISSOES_VAZIAS: Permissoes = {
  isAdmin: false,
  verAgenda: false,
  realizarAgendamentos: false,
  verContatoCliente: false,
  verValoresServicos: false,
  acessarClientes: false,
  acessarServicos: false,
  acessarProdutos: false,
  acessarDespesas: false,
  acessarFinanceiro: false,
  verComissoesReceber: false,
  verComissoesPagar: false,
  marcarComissaoPaga: false,
  verPagamentosComissao: false,
  acessarProntuarios: false,
  acessarRelatorios: false,
  acessarConfiguracoesTaxas: false,
  acessarNotasFiscais: false,
  movimentarEstoque: false,
};

export type Sessao = {
  usuarioId: string;
  tenantId: string;
  nome: string;
  email: string;
  profissionalId: string | null;
  permissoes: Permissoes;
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
    const parsed = JSON.parse(payload) as Sessao;
    // Compatibilidade com sessões antigas (sem o objeto permissoes):
    // se faltar, considera tudo false (forçar relogar).
    if (!parsed.permissoes) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function exigirSessao(): Promise<Sessao> {
  const sessao = await getSessao();
  if (!sessao) throw new Error("Não autenticado");
  return sessao;
}

/**
 * Verifica se a sessão tem uma permissão específica.
 * Admin (`isAdmin: true`) sempre passa em qualquer verificação.
 */
export function temPermissao(sessao: Sessao, chave: keyof Permissoes): boolean {
  if (sessao.permissoes.isAdmin) return true;
  return sessao.permissoes[chave] === true;
}

/**
 * Exige uma permissão específica. Lança Error 403 se não tiver.
 * Use no início de API routes que precisam de permissão granular.
 */
export async function exigirPermissao(chave: keyof Permissoes): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (!temPermissao(sessao, chave)) {
    const err = new Error("Sem permissão");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
  return sessao;
}

export function criarCookieSessao(sessao: Sessao): string {
  return assinar(JSON.stringify(sessao));
}
