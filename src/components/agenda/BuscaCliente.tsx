"use client";

import { useState, useRef } from "react";
import { ArrowLeft, X, Search, ChevronRight } from "lucide-react";

type AgendamentoBusca = {
  id: string;
  inicio: string;
  fim: string;
  cliente: { id: string; nome: string; telefone1: string | null } | null;
  profissional: { id: string; nome: string; cor: string };
  status: { id: string; nome: string; cor: string } | null;
  itens: { servico: { nome: string } }[];
};

type Props = {
  onClose: () => void;
  onNavegar?: (data: Date, agendamentoId?: string) => void;
};

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_LONGO = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dataKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatarDataGrupo(iso: string): string {
  const d = new Date(iso);
  return `${DIAS_LONGO[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatarHora(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isFuturoOuHoje(chave: string): boolean {
  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;
  return chave >= hojeStr;
}

export function BuscaCliente({ onClose, onNavegar }: Props) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<AgendamentoBusca[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [jaFezBusca, setJaFezBusca] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pesquisar() {
    const termo = busca.trim();
    if (!termo) return;
    setCarregando(true);
    setJaFezBusca(true);
    try {
      const r = await fetch(`/api/agendamentos/busca?nome=${encodeURIComponent(termo)}`);
      const dados = await r.json();
      setResultados(Array.isArray(dados) ? dados : []);
    } catch {
      setResultados([]);
    } finally {
      setCarregando(false);
    }
  }

  // Agrupar por data (mais recente no topo)
  const grupos: Record<string, AgendamentoBusca[]> = {};
  for (const ag of resultados) {
    const k = dataKey(ag.inicio);
    if (!grupos[k]) grupos[k] = [];
    grupos[k].push(ag);
  }
  const datas = Object.keys(grupos).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col h-full bg-[#faf8f4]">

      {/* Barra de busca */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-b border-[#e8dcc4] flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded text-[#9a7d50] hover:bg-[#faf5ee] flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <input
          ref={inputRef}
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") pesquisar(); }}
          placeholder="Buscar cliente..."
          className="flex-1 text-base outline-none bg-transparent text-[#5a4530] placeholder-[#9a7d50]/60"
        />
        {busca && (
          <button
            onClick={() => {
              setBusca("");
              setResultados([]);
              setJaFezBusca(false);
              inputRef.current?.focus();
            }}
            className="p-1 text-[#9a7d50] flex-shrink-0"
          >
            <X size={16} />
          </button>
        )}
        {busca && (
          <button
            onClick={pesquisar}
            className="px-3 py-1 bg-[#B89968] text-white text-sm font-medium rounded-md flex-shrink-0"
          >
            Buscar
          </button>
        )}
      </div>

      {/* Nota de limite */}
      {jaFezBusca && !carregando && (
        <div className="px-4 py-2 text-xs text-[#9a7d50] border-b border-[#e8dcc4]/50 flex-shrink-0">
          Apenas os 30 primeiros resultados são mostrados.
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto">

        {carregando && (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 border-[#B89968] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!carregando && !jaFezBusca && (
          <div className="flex flex-col items-center justify-center py-20 text-[#9a7d50]/60 gap-3">
            <Search size={36} />
            <p className="text-sm">Digite o nome da cliente e pressione Buscar</p>
          </div>
        )}

        {!carregando && jaFezBusca && resultados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[#9a7d50]/60 gap-3">
            <Search size={36} />
            <p className="text-sm">Nenhum agendamento encontrado</p>
          </div>
        )}

        {!carregando && datas.map((dataK) => {
          const ags = grupos[dataK];
          const futuro = isFuturoOuHoje(dataK);
          const dataDisplay = formatarDataGrupo(ags[0].inicio);

          return (
            <div key={dataK}>
              {/* Cabeçalho da data */}
              <button
                onClick={() => {
                  const d = new Date(dataK + "T12:00");
                  onNavegar?.(d);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#f0ede8] hover:bg-[#e8dcc4]/60 transition-colors"
              >
                <span className={`font-semibold text-sm ${futuro ? "text-red-500" : "text-[#5a4530]"}`}>
                  {dataDisplay}
                </span>
                <ChevronRight size={16} className={futuro ? "text-red-400" : "text-[#9a7d50]"} />
              </button>

              {/* Agendamentos do dia */}
              {ags.map((ag) => (
                <button
                  key={ag.id}
                  onClick={() => {
                    const d = new Date(dataK + "T12:00");
                    onNavegar?.(d, ag.id);
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 border-b border-[#e8dcc4]/50 hover:bg-[#faf5ee] transition-colors text-left"
                >
                  {/* Horários */}
                  <div className="flex-shrink-0 w-12 text-right">
                    <p className="text-[#5a4530] text-sm font-medium">{formatarHora(ag.inicio)}</p>
                    <p className="text-[#9a7d50] text-xs">{formatarHora(ag.fim)}</p>
                  </div>
                  {/* Nome + serviço */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#5a4530] text-sm font-medium truncate">
                      {ag.cliente?.nome ?? "Bloqueio"}
                    </p>
                    <p className="text-[#9a7d50] text-xs truncate">
                      {ag.itens[0]?.servico.nome ?? ag.profissional.nome}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
