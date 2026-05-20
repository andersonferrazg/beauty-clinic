/**
 * Deriva iniciais de exibição do nome de um tenant.
 *
 * Casos:
 * - "LB Beauty Clinic" → "LB" (primeira palavra já é sigla)
 * - "Dra. Fulana Estética" → "FE" (Dra. é tratamento, não conta)
 * - "Beauty Clinic" → "BC"
 * - "Studio Bella" → "SB"
 * - "Solo" → "SO"
 * - "" / undefined → "?"
 */
export function iniciaisDoNome(nome: string | null | undefined): string {
  if (!nome) return "?";
  const palavras = nome.trim().split(/\s+/);

  const primeira = palavras[0] ?? "";
  if (
    primeira.length >= 2 &&
    primeira.length <= 4 &&
    primeira === primeira.toUpperCase() &&
    /^[A-Z]+$/.test(primeira)
  ) {
    return primeira;
  }

  const irrelevantes = new Set(["da", "de", "do", "das", "dos", "e", "a", "o", "dr.", "dra.", "dr", "dra"]);
  const significantes = palavras.filter((p) => !irrelevantes.has(p.toLowerCase()));
  const usadas = significantes.length > 0 ? significantes : palavras;
  const iniciais = usadas
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();

  if (iniciais.length === 1 && primeira.length >= 2) {
    return (primeira[0] + primeira[1]).toUpperCase();
  }

  return iniciais || "?";
}
