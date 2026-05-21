"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalOrcamento } from "@/components/modal-orcamento";
import { Search, Plus, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type Orcamento = {
  id: string;
  status: string;
  valorTotal: number;
  dataValidade: string;
  criadoEm: string;
  observacao: string | null;
  agendamentoId: string | null;
  cliente: { id: string; nome: string; telefone1: string | null };
  profissional: { id: string; nome: string; cor: string } | null;
  itens: { id: string; servico: { nome: string } | null; produto: { nome: string } | null; preco: number; quantidade: number }[];
};

const STATUS_OPCOES = [
  { valor: "", label: "Todos" },
  { valor: "EM_ABERTO", label: "Em Aberto" },
  { valor: "APROVADO", label: "Aprovado" },
  { valor: "FECHADO", label: "Fechado" },
  { valor: "CANCELADO", label: "Cancelado" },
  { valor: "EXPIRADO", label: "Expirado" },
];

const STATUS_LABEL: Record<string, string> = {
  EM_ABERTO: "Em Aberto",
  APROVADO: "Aprovado",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "EM_ABERTO": return "bg-amber-100 text-amber-800 border-amber-200";
    case "APROVADO": return "bg-blue-100 text-blue-800 border-blue-200";
    case "FECHADO": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "CANCELADO": return "bg-gray-100 text-gray-700 border-gray-200";
    case "EXPIRADO": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatarBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function diasRestantes(dataValidade: string): number {
  const dt = new Date(dataValidade);
  return Math.round((dt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [carregando, setCarregando] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [orcSelecionado, setOrcSelecionado] = useState<string | undefined>();

  async function carregar() {
    setCarregando(true);
    const params = new URLSearchParams();
    if (busca) params.set("q", busca);
    if (filtroStatus) params.set("status", filtroStatus);
    const url = `/api/orcamentos${params.toString() ? `?${params.toString()}` : ""}`;
    const r = await fetch(url);
    const dados = await r.json();
    setOrcamentos(Array.isArray(dados) ? dados : []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    const t = setTimeout(() => carregar(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, filtroStatus]);

  function abrirNovo() {
    setOrcSelecionado(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(id: string) {
    setOrcSelecionado(id);
    setModalAberto(true);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Orçamentos</h1>
          <p className="text-sm text-[#9a7d50] mt-1">
            {carregando ? "Carregando..." : `${orcamentos.length} orçamento(s) encontrado(s)`}
          </p>
        </div>
        <Button onClick={abrirNovo} className="bg-[#B89968] hover:bg-[#9a7d50] text-white gap-1.5">
          <Plus size={16} />
          Novo Orçamento
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7d50]" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome do cliente..."
            className="pl-9 border-[#B89968]/30"
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_OPCOES.map((s) => (
            <button
              key={s.valor}
              onClick={() => setFiltroStatus(s.valor)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                filtroStatus === s.valor
                  ? "border-[#B89968] bg-[#B89968] text-white"
                  : "border-[#B89968]/30 text-[#9a7d50] hover:bg-[#faf5ee]"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="text-center py-20 text-[#9a7d50]">
          <FileText size={32} className="mx-auto mb-3 text-[#B89968]/60" />
          <p className="text-base mb-1">
            {busca || filtroStatus ? "Nenhum orçamento encontrado." : "Nenhum orçamento criado ainda."}
          </p>
          <p className="text-sm">Clique em &quot;Novo Orçamento&quot; para começar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Data</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Profissional</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Itens</th>
                <th className="text-right px-4 py-3 text-[#9a7d50] font-medium">Valor</th>
                <th className="text-center px-4 py-3 text-[#9a7d50] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Validade</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((o, i) => {
                const dias = diasRestantes(o.dataValidade);
                const totalItens = o.itens.length;
                const primeiroItem = o.itens[0]?.servico?.nome || o.itens[0]?.produto?.nome || "—";
                return (
                  <tr
                    key={o.id}
                    onClick={() => abrirEdicao(o.id)}
                    className={cn(
                      "border-b border-[#e8dcc4] hover:bg-[#faf5ee] cursor-pointer transition-colors",
                      i === orcamentos.length - 1 ? "border-b-0" : ""
                    )}
                  >
                    <td className="px-4 py-3 text-[#5a4530] text-xs whitespace-nowrap">
                      {new Date(o.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#B89968] to-[#9a7d50] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {o.cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-[#5a4530]">{o.cliente.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#5a4530] text-xs">
                      {o.profissional ? (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: o.profissional.cor }}
                          />
                          {o.profissional.nome}
                        </span>
                      ) : (
                        <span className="text-[#9a7d50] italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#5a4530] text-xs">
                      {totalItens > 1
                        ? `${primeiroItem} +${totalItens - 1}`
                        : primeiroItem}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#5a4530] whitespace-nowrap">
                      {formatarBRL(o.valorTotal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border",
                        statusBadgeClass(o.status)
                      )}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9a7d50]">
                      {o.status === "EXPIRADO" || dias < 0 ? (
                        <span className="text-red-600">Vencido</span>
                      ) : (
                        <span>{dias} {dias === 1 ? "dia" : "dias"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ModalOrcamento
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={carregar}
        orcamentoId={orcSelecionado}
      />
    </div>
  );
}
