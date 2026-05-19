import { NextRequest, NextResponse } from "next/server";

const ROTAS_PUBLICAS = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const ehPublica = ROTAS_PUBLICAS.some((r) => pathname.startsWith(r));
  const ehApi = pathname.startsWith("/api");
  const ehStatic = pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  if (ehPublica || ehApi || ehStatic) return NextResponse.next();

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
