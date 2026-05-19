import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  await exigirSessao();

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const pasta = (formData.get("pasta") as string) ?? "prontuarios";

  if (!file) return NextResponse.json({ erro: "Nenhum arquivo enviado" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", pasta);

  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, nome), buffer);

  return NextResponse.json({ url: `/uploads/${pasta}/${nome}` });
}
