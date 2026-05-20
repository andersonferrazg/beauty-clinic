import { NextResponse } from "next/server";
import { getSessao } from "@/lib/session";

/**
 * Retorna a sessão atual para uso client-side (Sidebar, Agenda, etc).
 * Sem `exigirSessao` aqui — se não tiver sessão, retorna null (não erro 500).
 */
export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(sessao);
}
