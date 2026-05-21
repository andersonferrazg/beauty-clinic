import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/session";

const MAX_MB = 5;

export async function POST(req: NextRequest) {
  await exigirSessao();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ erro: "Erro ao ler o arquivo." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ erro: "Nenhum arquivo enviado." }, { status: 400 });

  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { erro: `Arquivo muito grande. Máximo ${MAX_MB}MB. Tente reduzir a qualidade da foto.` },
      { status: 413 }
    );
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type || "image/jpeg";
  const url = `data:${mimeType};base64,${base64}`;

  return NextResponse.json({ url });
}
