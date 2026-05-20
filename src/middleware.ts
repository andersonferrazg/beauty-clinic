import { NextRequest, NextResponse } from "next/server";

const ROTAS_PUBLICAS = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const ehPublica = ROTAS_PUBLICAS.some((r) => pathname.startsWith(r));
  const ehApi = pathname.startsWith("/api");
  // Qualquer rota com extensão de arquivo (ex: /logo.jpeg, /file.svg, /manifest.json)
  // serve arquivos estáticos de /public — não devem exigir autenticação.
  const ehArquivoEstatico =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.[a-zA-Z0-9]{2,5}$/.test(pathname);

  if (ehPublica || ehApi || ehArquivoEstatico) return NextResponse.next();

  const sessao = req.cookies.get("sessao")?.value;
  if (!sessao) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
