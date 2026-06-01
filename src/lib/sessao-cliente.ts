// Cache client-side da sessão — evita múltiplas chamadas simultâneas a /api/me/sessao
let cache: { dados: unknown; expiraEm: number } | null = null;
let pendente: Promise<unknown> | null = null;

export async function getSessaoCliente(): Promise<unknown> {
  if (cache && Date.now() < cache.expiraEm) return cache.dados;
  if (!pendente) {
    pendente = fetch("/api/me/sessao")
      .then((r) => r.json())
      .then((s) => {
        cache = { dados: s, expiraEm: Date.now() + 60_000 };
        pendente = null;
        return s;
      })
      .catch((e) => {
        pendente = null;
        throw e;
      });
  }
  return pendente;
}

export function invalidarSessaoCliente() {
  cache = null;
  pendente = null;
}
