const map = new Map<string, { count: number; resetAt: number }>();

export function verificarRateLimit(chave: string, max: number, janelaMs: number): boolean {
  const agora = Date.now();
  const entry = map.get(chave);
  if (!entry || agora > entry.resetAt) {
    map.set(chave, { count: 1, resetAt: agora + janelaMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}
