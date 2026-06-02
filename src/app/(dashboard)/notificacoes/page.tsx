"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, CalendarDays, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  linkRelativo: string | null;
  lida: boolean;
  criadaEm: string;
};

type AcaoFeita = "confirmado" | "cancelado" | "carregando";

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? "s" : ""}`;
}

export default function NotificacoesPage() {
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [acoes, setAcoes] = useState<Record<string, AcaoFeita>>({});

  function carregar() {
    fetch("/api/notificacoes")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setNotificacoes(d); })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }

  useEffect(() => { carregar(); }, []);

  async function marcarTodas() {
    await fetch("/api/notificacoes/marcar-todas", { method: "POST" });
    carregar();
  }

  async function clicar(n: Notificacao) {
    if (!n.lida) {
      await fetch(`/api/notificacoes/${n.id}`, { method: "PATCH" });
    }
    if (n.linkRelativo) router.push(n.linkRelativo);
    else carregar();
  }

  async function executarAcao(notif: Notificacao, acao: "confirmar" | "cancelar") {
    setAcoes((prev) => ({ ...prev, [notif.id]: "carregando" }));
    try {
      await fetch(`/api/notificacoes/${notif.id}/acao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao }),
      });
      setAcoes((prev) => ({ ...prev, [notif.id]: acao === "confirmar" ? "confirmado" : "cancelado" }));
    } catch {
      setAcoes((prev) => { const next = { ...prev }; delete next[notif.id]; return next; });
    }
    carregar();
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-[#B89968]" />
          <h1 className="text-xl font-bold text-[#5a4530]">Notificações</h1>
          {naoLidas > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {naoLidas}
            </span>
          )}
        </div>
        {naoLidas > 0 && (
          <button
            onClick={marcarTodas}
            className="flex items-center gap-1 text-xs text-[#9a7d50] hover:text-[#5a4530] border border-[#e8dcc4] rounded-lg px-3 py-1.5"
          >
            <CheckCheck size={13} /> Marcar todas como lidas
          </button>
        )}
      </div>

      {carregando ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificacoes.map((n) => {
            const ehOnline = n.tipo === "AGENDAMENTO_ONLINE";
            const acaoFeita = acoes[n.id];
            const mostrarBotoes = ehOnline && !n.lida && acaoFeita !== "confirmado" && acaoFeita !== "cancelado";
            const mostrarBadge = ehOnline && (acaoFeita === "confirmado" || acaoFeita === "cancelado");

            if (mostrarBotoes) {
              const carregandoAcao = acaoFeita === "carregando";
              return (
                <div
                  key={n.id}
                  className="rounded-xl border p-4 bg-[#faf5ee] border-[#B89968]/30 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0 bg-[#B89968]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#5a4530]">{n.titulo}</p>
                      {n.descricao && <p className="text-xs text-gray-500 mt-0.5">{n.descricao}</p>}
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
                        <CalendarDays size={10} />
                        {tempoRelativo(n.criadaEm)}
                        {n.linkRelativo && (
                          <button
                            onClick={() => clicar(n)}
                            className="ml-2 text-[#B89968] hover:underline"
                          >
                            Ver na agenda →
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => executarAcao(n, "confirmar")}
                          disabled={carregandoAcao}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-xs font-medium transition-colors"
                        >
                          {carregandoAcao ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Confirmar
                        </button>
                        <button
                          onClick={() => executarAcao(n, "cancelar")}
                          disabled={carregandoAcao}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-medium transition-colors"
                        >
                          {carregandoAcao ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (mostrarBadge) {
              const confirmado = acaoFeita === "confirmado";
              return (
                <div
                  key={n.id}
                  className="rounded-xl border p-4 bg-white border-[#e8dcc4] opacity-75"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0 bg-gray-300" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#5a4530]">{n.titulo}</p>
                      {n.descricao && <p className="text-xs text-gray-500 mt-0.5">{n.descricao}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <CalendarDays size={10} />
                          {tempoRelativo(n.criadaEm)}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            confirmado ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {confirmado ? "✓ Confirmado" : "✗ Cancelado"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Notificação padrão — clique navega
            return (
              <button
                key={n.id}
                onClick={() => clicar(n)}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
                  n.lida
                    ? "bg-white border-[#e8dcc4] opacity-70"
                    : "bg-[#faf5ee] border-[#B89968]/30 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.lida ? "bg-gray-300" : "bg-[#B89968]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#5a4530]">{n.titulo}</p>
                    {n.descricao && <p className="text-xs text-gray-500 mt-0.5">{n.descricao}</p>}
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
                      <CalendarDays size={10} />
                      {tempoRelativo(n.criadaEm)}
                      {n.linkRelativo && <span className="ml-2 text-[#B89968]">Abrir agenda →</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
