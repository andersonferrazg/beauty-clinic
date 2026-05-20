import { NextRequest, NextResponse } from "next/server";

const ROTAS_PUBLICAS = ["/login"];

type Permissoes = Record<string, boolean>;

function parseSessaoCookie(raw: string): { permissoes?: Permissoes } | null {
  try {
    const idx = raw.lastIndexOf(".");
    if (idx === -1) return null;
    const payload = raw.slice(0, idx);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// Cada entrada: [prefixo-da-rota, função-que-verifica-permissão]
const PERMISSAO_POR_ROTA: Array<[string, (p: Permissoes) => boolean]> = [
  ["/prontuarios", (p) => p.isAdmin || p.acessarProntuarios],
  ["/financeiro", (p) => p.isAdmin || p.acessarFinanceiro],
  ["/comandas", (p) => p.isAdmin || p.acessarFinanceiro],
  ["/gastos", (p) => p.isAdmin || p.acessarDespesas],
  ["/comissoes", (p) => p.isAdmin || p.verComissoesReceber || p.verPagamentosComissao],
  ["/produtos", (p) => p.isAdmin || p.acessarProdutos],
  ["/servicos", (p) => p.isAdmin || p.acessarServicos],
  ["/mensagens", (p) => p.isAdmin || p.acessarServicos],
  ["/clientes", (p) => p.isAdmin || p.acessarClientes],
  ["/profissionais", (p) => p.isAdmin],
  ["/configuracoes", (p) => p.isAdmin],
  ["/relatorios", (p) => p.isAdmin || p.acessarRelatorios],
  ["/agenda", (p) => p.isAdmin || p.verAgenda],
  ["/confirmacoes", (p) => p.isAdmin || p.verAgenda],
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const ehPublica = ROTAS_PUBLICAS.some((r) => pathname.startsWith(r));
  const ehApi = pathname.startsWith("/api");
  const ehArquivoEstatico =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.[a-zA-Z0-9]{2,5}$/.test(pathname);

  if (ehPublica || ehApi || ehArquivoEstatico) return NextResponse.next();

  const raw = req.cookies.get("sessao")?.value;
  if (!raw) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Verifica permissão por rota
  const sessao = parseSessaoCookie(raw);
  const permissoes = sessao?.permissoes ?? {};

  for (const [prefixo, temPermissao] of PERMISSAO_POR_ROTA) {
    if (pathname === prefixo || pathname.startsWith(prefixo + "/")) {
      if (!temPermissao(permissoes)) {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
