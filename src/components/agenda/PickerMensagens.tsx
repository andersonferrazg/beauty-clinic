"use client";

import { useEffect, useState } from "react";
import { X, Search, MessageSquare, Loader2, Send } from "lucide-react";
import { substituirVariaveis } from "@/lib/templateVars";

type Msg = { id: string; nome: string; texto: string };

type DadosAgendamento = {
  clienteNome?: string;
  dataStr?: string;
  horaInicio?: string;
  horaFim?: string;
  servicos?: string[];
  profissionalNome?: string;
  nomeClinica?: string;
  valorTotal?: number;
};

type Props = {
  dados: DadosAgendamento;
  telefone: string;
  onFechar: () => void;
};

function linkWA(telefone: string, texto: string): string {
  const num = "55" + telefone.replace(/\D/g, "");
  const enc = encodeURIComponent(texto);
  if (typeof window !== "undefined" && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    return `whatsapp://send?phone=${num}&text=${enc}`;
  }
  return `https://web.whatsapp.com/send?phone=${num}&text=${enc}`;
}

export function PickerMensagens({ dados, telefone, onFechar }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [preview, setPreview] = useState<Msg | null>(null);

  useEffect(() => {
    fetch("/api/msgs-predefinidas")
      .then((r) => r.json())
      .then((d) => {
        setMsgs(Array.isArray(d) ? d : []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, []);

  const filtradas = msgs.filter((m) =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    m.texto.toLowerCase().includes(busca.toLowerCase())
  );

  function textoSubstituido(msg: Msg): string {
    return substituirVariaveis(msg.texto, dados);
  }

  function enviar(msg: Msg) {
    const url = linkWA(telefone, textoSubstituido(msg));
    window.open(url, "_blank");
    onFechar();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[70]" onClick={onFechar}>
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8dcc4] flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-[#B89968]" />
            <p className="text-sm font-semibold text-[#5a4530]">Enviar mensagem</p>
          </div>
          <button onClick={onFechar} className="p-1.5 text-[#9a7d50] hover:bg-[#faf5ee] rounded-md">
            <X size={16} />
          </button>
        </div>

        {!preview ? (
          <>
            {/* Busca */}
            <div className="px-3 py-2 border-b border-[#e8dcc4] flex-shrink-0">
              <div className="flex items-center gap-2 bg-[#faf5ee] rounded-lg px-3 py-1.5">
                <Search size={14} className="text-[#9a7d50] flex-shrink-0" />
                <input
                  autoFocus
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar template..."
                  className="flex-1 text-sm bg-transparent outline-none text-[#5a4530] placeholder-[#9a7d50]/60"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {carregando && (
                <div className="flex justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-[#B89968]" />
                </div>
              )}

              {!carregando && filtradas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-[#9a7d50]/60 gap-2">
                  <MessageSquare size={28} />
                  <p className="text-sm">Nenhum template encontrado</p>
                  {msgs.length === 0 && (
                    <a href="/mensagens" className="text-xs text-[#B89968] underline mt-1">
                      Cadastrar mensagens pré-definidas
                    </a>
                  )}
                </div>
              )}

              {!carregando && filtradas.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setPreview(msg)}
                  className="w-full text-left px-4 py-3 border-b border-[#e8dcc4]/50 hover:bg-[#faf5ee] transition-colors"
                >
                  <p className="text-sm font-medium text-[#5a4530]">{msg.nome}</p>
                  <p className="text-xs text-[#9a7d50] mt-0.5 line-clamp-2 leading-relaxed">
                    {textoSubstituido(msg).slice(0, 120)}…
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Preview da mensagem selecionada */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-3">{preview.nome}</p>
              <div className="bg-[#dcf8c6] rounded-xl rounded-tl-none p-4 shadow-sm">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {textoSubstituido(preview)}
                </pre>
                <p className="text-xs text-gray-400 text-right mt-2">09:27 ✓✓</p>
              </div>
            </div>

            {/* Footer com botões */}
            <div className="flex gap-3 px-4 py-3 border-t border-[#e8dcc4] flex-shrink-0">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 border border-[#e8dcc4] rounded-lg py-2.5 text-sm text-[#9a7d50] hover:bg-[#faf5ee] transition-colors font-medium"
              >
                Voltar
              </button>
              <button
                onClick={() => enviar(preview)}
                className="flex-1 bg-[#25D366] hover:bg-[#20bb5a] text-white rounded-lg py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Send size={14} />
                Abrir WhatsApp
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
