"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X, Plus, Trash2, Loader2, Search, Printer, ArrowRight, Lock,
  Phone, MessageCircle, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Profissional = { id: string; nome: string; cor: string };
type Cliente = { id: string; nome: string; telefone1: string | null };
type Servico = { id: string; nome: string; preco: number; cor: string };

type ItemOrc = {
  servicoId: string;
  nomeServico: string;
  preco: number;
  quantidade: number;
};

type InteracaoOrc = {
  id: string;
  tipo: string;
  texto: string;
  criadoEm: string;
};

const TIPOS_INTERACAO = [
  { valor: "LIGACAO", label: "Ligação", Icon: Phone },
  { valor: "WHATSAPP", label: "WhatsApp", Icon: MessageCircle },
  { valor: "NOTA", label: "Nota", Icon: FileText },
] as const;

const TIPO_LABEL: Record<string, string> = { LIGACAO: "Ligação", WHATSAPP: "WhatsApp", NOTA: "Nota" };
const TIPO_ICONE = { LIGACAO: Phone, WHATSAPP: MessageCircle, NOTA: FileText } as Record<string, React.ComponentType<{ size?: number; className?: string }>>;

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  orcamentoId?: string;
  clienteFixo?: { id: string; nome: string } | null;
};

const STATUS_OPCOES = [
  { valor: "EM_ABERTO", label: "Em Aberto" },
  { valor: "APROVADO", label: "Aprovado" },
  { valor: "FECHADO", label: "Fechado" },
  { valor: "CANCELADO", label: "Cancelado" },
];

const STATUS_LABEL: Record<string, string> = {
  EM_ABERTO: "Em Aberto",
  APROVADO: "Aprovado",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
};

const DIAS_VALIDADE = [7, 15, 30];

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatarBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function dataParaLocalStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function diasEntre(de: Date, ate: Date): number {
  return Math.round((ate.getTime() - de.getTime()) / (1000 * 60 * 60 * 24));
}

export function ModalOrcamento({
  aberto,
  onFechar,
  onSalvo,
  orcamentoId,
  clienteFixo,
}: Props) {
  const ehEdicao = !!orcamentoId;

  // ── Dados ────────────────────────────────────────────────────────────────
  const [clienteId, setClienteId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [status, setStatus] = useState("EM_ABERTO");
  const [dataValidadeStr, setDataValidadeStr] = useState(
    dataParaLocalStr(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );
  const [observacao, setObservacao] = useState("");
  const [itens, setItens] = useState<ItemOrc[]>([]);
  const [agendamentoVinculado, setAgendamentoVinculado] = useState<string | null>(null);

  // ── Listas ───────────────────────────────────────────────────────────────
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);

  // ── Busca cliente ────────────────────────────────────────────────────────
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([]);
  const [mostrarSugestoesCli, setMostrarSugestoesCli] = useState(false);

  // ── Busca item por linha ─────────────────────────────────────────────────
  const [buscaItem, setBuscaItem] = useState<string[]>([]);
  const [mostrarSugestoesItem, setMostrarSugestoesItem] = useState<boolean[]>([]);

  // ── Sessão ───────────────────────────────────────────────────────────────
  type SessaoSimples = { permissoes?: { isAdmin?: boolean }; profissionalId?: string | null };
  const [minhaSessao, setMinhaSessao] = useState<SessaoSimples | null>(null);

  // ── Interações ───────────────────────────────────────────────────────────
  const [interacoes, setInteracoes] = useState<InteracaoOrc[]>([]);
  const [novaInteracaoTipo, setNovaInteracaoTipo] = useState<string>("NOTA");
  const [novaInteracaoTexto, setNovaInteracaoTexto] = useState("");
  const [adicionandoInteracao, setAdicionandoInteracao] = useState(false);

  // ── Estado UI ────────────────────────────────────────────────────────────
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [convertendo, setConvertendo] = useState(false);
  const [mostrarConverter, setMostrarConverter] = useState(false);
  const [convInicio, setConvInicio] = useState("");
  const [convDuracao, setConvDuracao] = useState(60);
  const [convData, setConvData] = useState(dataParaLocalStr(new Date()));
  const [convHora, setConvHora] = useState("09:00");
  const [convProfissionalId, setConvProfissionalId] = useState("");
  const [erro, setErro] = useState("");

  const refSugCli = useRef<HTMLDivElement>(null);

  const total = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);

  // Dias restantes pra validade
  const diasRestantes = (() => {
    if (!dataValidadeStr) return 0;
    const dt = new Date(`${dataValidadeStr}T23:59:59`);
    return diasEntre(new Date(), dt);
  })();

  // ── Sessão ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/me/sessao").then((r) => r.json()).then(setMinhaSessao).catch(() => {});
  }, []);

  // ── Inicializar ao abrir novo ────────────────────────────────────────────
  useEffect(() => {
    if (aberto && !orcamentoId) {
      // Cliente fixo?
      if (clienteFixo) {
        setClienteId(clienteFixo.id);
        setClienteNome(clienteFixo.nome);
      }
      // Validade padrão = 30 dias
      escolherValidade(30);
      // Profissional padrão = logada
      const profId = !minhaSessao?.permissoes?.isAdmin && minhaSessao?.profissionalId
        ? minhaSessao.profissionalId
        : "";
      setProfissionalId(profId ?? "");
    }
  }, [aberto, orcamentoId, clienteFixo, minhaSessao]);

  // ── Carregar listas ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!aberto) return;
    fetch("/api/profissionais").then((r) => r.json()).then((lista: Profissional[]) => {
      if (!minhaSessao?.permissoes?.isAdmin && minhaSessao?.profissionalId) {
        setProfissionais(lista.filter((p) => p.id === minhaSessao.profissionalId));
      } else {
        setProfissionais(lista);
      }
    });
    fetch("/api/servicos").then((r) => r.json()).then(setServicos);
  }, [aberto, minhaSessao]);

  // ── Carregar orçamento existente ─────────────────────────────────────────
  useEffect(() => {
    if (!aberto || !orcamentoId) return;
    fetch(`/api/orcamentos/${orcamentoId}`)
      .then((r) => r.json())
      .then((o) => {
        setClienteId(o.clienteId);
        setClienteNome(o.cliente?.nome ?? "");
        setProfissionalId(o.profissionalId ?? "");
        setStatus(o.status);
        setObservacao(o.observacao ?? "");
        setAgendamentoVinculado(o.agendamentoId ?? null);
        const dt = new Date(o.dataValidade);
        setDataValidadeStr(dataParaLocalStr(dt));
        setItens(
          o.itens.map((i: { servicoId: string; servico?: { nome?: string }; preco: number; quantidade: number }) => ({
            servicoId: i.servicoId,
            nomeServico: i.servico?.nome ?? "",
            preco: i.preco,
            quantidade: i.quantidade,
          }))
        );
        setInteracoes(o.interacoes ?? []);
      });
  }, [aberto, orcamentoId]);

  // ── Reset ao fechar ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!aberto) {
      setClienteId("");
      setClienteNome("");
      setBuscaCliente("");
      setProfissionalId("");
      setStatus("EM_ABERTO");
      setObservacao("");
      setItens([]);
      setBuscaItem([]);
      setMostrarSugestoesItem([]);
      setErro("");
      setConfirmarExclusao(false);
      setMostrarConverter(false);
      setAgendamentoVinculado(null);
      setInteracoes([]);
      setNovaInteracaoTexto("");
      setNovaInteracaoTipo("NOTA");
      escolherValidade(30);
    }
  }, [aberto]);

  // ── Busca de cliente ─────────────────────────────────────────────────────
  useEffect(() => {
    if (buscaCliente.length < 2) { setClientesSugeridos([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/clientes?q=${encodeURIComponent(buscaCliente)}`)
        .then((r) => r.json())
        .then(setClientesSugeridos);
    }, 300);
    return () => clearTimeout(t);
  }, [buscaCliente]);

  // Click fora pra fechar sugestões cliente
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (refSugCli.current && !refSugCli.current.contains(e.target as Node)) {
        setMostrarSugestoesCli(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function escolherValidade(dias: number) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    setDataValidadeStr(dataParaLocalStr(d));
  }

  function adicionarItem() {
    setItens((prev) => [...prev, { servicoId: "", nomeServico: "", preco: 0, quantidade: 1 }]);
    setBuscaItem((prev) => [...prev, ""]);
    setMostrarSugestoesItem((prev) => [...prev, true]);
  }

  function removerItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
    setBuscaItem((prev) => prev.filter((_, i) => i !== idx));
    setMostrarSugestoesItem((prev) => prev.filter((_, i) => i !== idx));
  }

  function selecionarServico(idx: number, servico: Servico) {
    setItens((prev) => {
      const n = [...prev];
      n[idx] = { servicoId: servico.id, nomeServico: servico.nome, preco: servico.preco, quantidade: 1 };
      return n;
    });
    setBuscaItem((prev) => { const n = [...prev]; n[idx] = servico.nome; return n; });
    setMostrarSugestoesItem((prev) => { const n = [...prev]; n[idx] = false; return n; });
  }

  function atualizarPrecoItem(idx: number, preco: number) {
    setItens((prev) => { const n = [...prev]; n[idx] = { ...n[idx], preco }; return n; });
  }

  function atualizarQuantidadeItem(idx: number, q: number) {
    setItens((prev) => { const n = [...prev]; n[idx] = { ...n[idx], quantidade: Math.max(1, q) }; return n; });
  }

  async function salvar() {
    if (!clienteId) { setErro("Selecione a cliente."); return; }
    if (itens.length === 0 || itens.every((i) => !i.servicoId)) {
      setErro("Adicione pelo menos um serviço.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const url = ehEdicao ? `/api/orcamentos/${orcamentoId}` : "/api/orcamentos";
      const method = ehEdicao ? "PATCH" : "POST";
      const payload = {
        clienteId,
        profissionalId: profissionalId || null,
        observacao: observacao || null,
        dataValidade: dataValidadeStr ? new Date(`${dataValidadeStr}T23:59:59`).toISOString() : null,
        ...(ehEdicao ? { status } : {}),
        itens: itens
          .filter((i) => i.servicoId)
          .map((i) => ({ servicoId: i.servicoId, preco: i.preco, quantidade: i.quantidade })),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErro(data.erro || "Erro ao salvar.");
        return;
      }
      onSalvo();
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!orcamentoId) return;
    setExcluindo(true);
    await fetch(`/api/orcamentos/${orcamentoId}`, { method: "DELETE" });
    setExcluindo(false);
    onSalvo();
    onFechar();
  }

  async function converter() {
    if (!orcamentoId || !convProfissionalId || !convData || !convHora) {
      setErro("Escolha profissional, data e hora.");
      return;
    }
    setConvertendo(true);
    setErro("");
    try {
      const inicioISO = new Date(`${convData}T${convHora}`).toISOString();
      const fimDate = new Date(`${convData}T${convHora}`);
      fimDate.setMinutes(fimDate.getMinutes() + convDuracao);
      const fimISO = fimDate.toISOString();

      const res = await fetch(`/api/orcamentos/${orcamentoId}/converter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profissionalId: convProfissionalId,
          inicio: inicioISO,
          fim: fimISO,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErro(data.erro || "Erro ao converter.");
        return;
      }
      onSalvo();
      onFechar();
    } finally {
      setConvertendo(false);
    }
  }

  async function adicionarInteracao() {
    if (!orcamentoId || !novaInteracaoTexto.trim()) return;
    setAdicionandoInteracao(true);
    try {
      const res = await fetch(`/api/orcamentos/${orcamentoId}/interacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: novaInteracaoTipo, texto: novaInteracaoTexto.trim() }),
      });
      if (res.ok) {
        const nova = await res.json();
        setInteracoes((prev) => [nova, ...prev]);
        setNovaInteracaoTexto("");
      }
    } finally {
      setAdicionandoInteracao(false);
    }
  }

  function imprimir() {
    if (!orcamentoId) return;
    window.open(`/orcamentos/${orcamentoId}/imprimir`, "_blank");
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onFechar} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#e8dcc4] px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-[#5a4530] font-semibold">
              {ehEdicao ? "Editando Orçamento" : "Novo Orçamento"}
            </h2>
            {ehEdicao && (
              <p className="text-xs text-[#9a7d50] mt-0.5">
                Status:{" "}
                <span className={cn(
                  "inline-block px-1.5 py-0.5 rounded text-[11px] font-medium",
                  status === "EM_ABERTO" && "bg-amber-100 text-amber-800",
                  status === "APROVADO" && "bg-blue-100 text-blue-800",
                  status === "FECHADO" && "bg-emerald-100 text-emerald-800",
                  status === "CANCELADO" && "bg-gray-100 text-gray-700",
                  status === "EXPIRADO" && "bg-red-100 text-red-800",
                )}>
                  {STATUS_LABEL[status]}
                </span>
              </p>
            )}
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Cliente */}
          <div className="space-y-1.5" ref={refSugCli}>
            <Label className="text-[#5a4530]">Cliente *</Label>
            {clienteFixo ? (
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-[#e8dcc4] bg-[#faf5ee] text-sm text-[#5a4530]">
                <Lock size={13} className="text-[#9a7d50]" />
                {clienteNome}
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7d50]" />
                <Input
                  className="pl-9 border-[#B89968]/30"
                  placeholder="Buscar cliente..."
                  value={clienteId ? clienteNome : buscaCliente}
                  onChange={(e) => {
                    if (clienteId) {
                      setClienteId("");
                      setClienteNome("");
                    }
                    setBuscaCliente(e.target.value);
                    setMostrarSugestoesCli(true);
                  }}
                  onFocus={() => setMostrarSugestoesCli(true)}
                />
                {mostrarSugestoesCli && clientesSugeridos.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-[200] bg-white border border-[#e8dcc4] rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {clientesSugeridos.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClienteId(c.id);
                          setClienteNome(c.nome);
                          setBuscaCliente("");
                          setMostrarSugestoesCli(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#faf5ee] text-[#5a4530] border-b border-[#e8dcc4] last:border-b-0"
                      >
                        <div>{c.nome}</div>
                        {c.telefone1 && <div className="text-xs text-[#9a7d50]">{c.telefone1}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profissional + Validade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#5a4530]">Profissional</Label>
              <select
                value={profissionalId}
                onChange={(e) => setProfissionalId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-[#B89968]/30 bg-transparent px-3 py-1 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              >
                <option value="">— Sem profissional —</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#5a4530]">Validade</Label>
              <div className="flex gap-1">
                {DIAS_VALIDADE.map((d) => {
                  const ativo = diasRestantes > 0 && Math.abs(diasRestantes - d) <= 1;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => escolherValidade(d)}
                      className={cn(
                        "flex-1 h-9 px-2 rounded-md text-xs font-medium border transition-colors",
                        ativo
                          ? "border-[#B89968] bg-[#B89968]/10 text-[#5a4530]"
                          : "border-[#B89968]/30 text-[#9a7d50] hover:bg-[#faf5ee]"
                      )}
                    >
                      {d} dias
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#9a7d50]">
                Vence em{" "}
                {new Date(`${dataValidadeStr}T23:59:59`).toLocaleDateString("pt-BR")}
                {diasRestantes > 0 ? ` (${diasRestantes} dias)` : " (já vencido)"}
              </p>
            </div>
          </div>

          {/* Status (apenas em edição) */}
          {ehEdicao && (
            <div className="space-y-1.5">
              <Label className="text-[#5a4530]">Status</Label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPCOES.map((s) => (
                  <button
                    key={s.valor}
                    type="button"
                    onClick={() => setStatus(s.valor)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      status === s.valor
                        ? "border-[#B89968] bg-[#B89968] text-white"
                        : "border-[#B89968]/30 text-[#9a7d50] hover:bg-[#faf5ee]"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
                {status === "EXPIRADO" && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-700">
                    Expirado (vencido)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Itens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[#5a4530]">Serviços</Label>
              <button
                type="button"
                onClick={adicionarItem}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#B89968] border border-[#B89968]/30 hover:bg-[#faf5ee]"
              >
                <Plus size={12} /> Adicionar
              </button>
            </div>

            {itens.length === 0 ? (
              <p className="text-xs text-[#9a7d50] italic py-2 text-center border border-dashed border-[#e8dcc4] rounded-md">
                Clique em &quot;Adicionar&quot; para incluir serviços
              </p>
            ) : (
              <div className="space-y-2">
                {itens.map((item, idx) => {
                  const sugestoes = item.servicoId
                    ? []
                    : servicos
                        .filter((s) =>
                          (buscaItem[idx] ?? "").length === 0
                            ? true
                            : s.nome.toLowerCase().includes((buscaItem[idx] ?? "").toLowerCase())
                        )
                        .slice(0, 8);

                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-6 relative">
                        <Input
                          className="border-[#B89968]/30 h-9 text-sm"
                          placeholder="Buscar serviço..."
                          value={item.servicoId ? item.nomeServico : (buscaItem[idx] ?? "")}
                          onChange={(e) => {
                            if (item.servicoId) {
                              setItens((prev) => {
                                const n = [...prev];
                                n[idx] = { ...n[idx], servicoId: "", nomeServico: "" };
                                return n;
                              });
                            }
                            setBuscaItem((prev) => { const n = [...prev]; n[idx] = e.target.value; return n; });
                            setMostrarSugestoesItem((prev) => { const n = [...prev]; n[idx] = true; return n; });
                          }}
                          onFocus={() => {
                            setMostrarSugestoesItem((prev) => { const n = [...prev]; n[idx] = true; return n; });
                          }}
                        />
                        {mostrarSugestoesItem[idx] && sugestoes.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-[200] bg-white border border-[#e8dcc4] rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {sugestoes.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => selecionarServico(idx, s)}
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#faf5ee] text-[#5a4530] border-b border-[#e8dcc4] last:border-b-0 flex items-center justify-between"
                              >
                                <span>{s.nome}</span>
                                <span className="text-xs text-[#9a7d50]">{formatarBRL(s.preco)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={1}
                          className="border-[#B89968]/30 h-9 text-sm text-center"
                          value={item.quantidade}
                          onChange={(e) => atualizarQuantidadeItem(idx, parseInt(e.target.value || "1", 10))}
                        />
                      </div>

                      <div className="col-span-3">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          className="border-[#B89968]/30 h-9 text-sm"
                          value={item.preco}
                          onChange={(e) => atualizarPrecoItem(idx, parseFloat(e.target.value || "0"))}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removerItem(idx)}
                        className="col-span-1 h-9 flex items-center justify-center text-[#9a7d50] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-1 border-t border-[#e8dcc4]">
              <div className="text-right">
                <p className="text-[11px] text-[#9a7d50] uppercase tracking-wider">Total</p>
                <p className="text-lg font-semibold text-[#5a4530]">{formatarBRL(total)}</p>
              </div>
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <Label className="text-[#5a4530]">Observação</Label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-[#B89968]/30 bg-transparent px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              placeholder="Observações sobre o orçamento, condições de pagamento, etc."
            />
          </div>

          {/* Log de interações — só em edição */}
          {ehEdicao && (
            <div className="space-y-2">
              <Label className="text-[#5a4530]">Histórico de Contatos</Label>

              {/* Formulário nova interação */}
              <div className="border border-[#e8dcc4] rounded-lg p-3 space-y-2 bg-[#fafaf9]">
                <div className="flex gap-1.5 flex-wrap">
                  {TIPOS_INTERACAO.map(({ valor, label, Icon }) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setNovaInteracaoTipo(valor)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                        novaInteracaoTipo === valor
                          ? "border-[#B89968] bg-[#B89968]/10 text-[#5a4530]"
                          : "border-[#e8dcc4] text-[#9a7d50] hover:bg-[#faf5ee]"
                      )}
                    >
                      <Icon size={11} /> {label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={novaInteracaoTexto}
                  onChange={(e) => setNovaInteracaoTexto(e.target.value)}
                  rows={2}
                  placeholder="Ex: Liguei, paciente vai pensar e retorna amanhã..."
                  className="flex w-full rounded-md border border-[#B89968]/30 bg-white px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968] resize-none"
                />
                <button
                  type="button"
                  onClick={adicionarInteracao}
                  disabled={!novaInteracaoTexto.trim() || adicionandoInteracao}
                  className="w-full py-1.5 rounded-md text-xs font-medium bg-[#B89968] text-white hover:bg-[#9a7d50] disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                >
                  {adicionandoInteracao ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Registrar
                </button>
              </div>

              {/* Lista de interações */}
              {interacoes.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {interacoes.map((interacao) => {
                    const Icon = TIPO_ICONE[interacao.tipo] ?? FileText;
                    return (
                      <div key={interacao.id} className="flex gap-2.5 text-sm">
                        <div className="shrink-0 w-7 h-7 rounded-full bg-[#faf5ee] border border-[#e8dcc4] flex items-center justify-center mt-0.5">
                          <Icon size={13} className="text-[#9a7d50]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-[#9a7d50]">
                            {new Date(interacao.criadoEm).toLocaleString("pt-BR", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })} · {TIPO_LABEL[interacao.tipo] ?? interacao.tipo}
                          </p>
                          <p className="text-[#5a4530] leading-snug">{interacao.texto}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#9a7d50] italic text-center py-1">
                  Nenhuma interação registrada ainda.
                </p>
              )}
            </div>
          )}

          {/* Botão Converter em Agendamento (quando aprovado e não convertido) */}
          {ehEdicao && status === "APROVADO" && !agendamentoVinculado && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
              {!mostrarConverter ? (
                <button
                  type="button"
                  onClick={() => {
                    setMostrarConverter(true);
                    setConvProfissionalId(profissionalId || "");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <ArrowRight size={14} /> Converter em Agendamento
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-blue-900">Agendar este orçamento</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-blue-900">Profissional</Label>
                      <select
                        value={convProfissionalId}
                        onChange={(e) => setConvProfissionalId(e.target.value)}
                        className="flex h-8 w-full rounded-md border border-blue-300 bg-white px-2 py-1 text-xs text-[#5a4530]"
                      >
                        <option value="">— Selecione —</option>
                        {profissionais.map((p) => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-900">Duração (min)</Label>
                      <Input
                        type="number"
                        min={15}
                        step={15}
                        value={convDuracao}
                        onChange={(e) => setConvDuracao(parseInt(e.target.value || "60", 10))}
                        className="h-8 text-xs border-blue-300"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-blue-900">Data</Label>
                      <Input
                        type="date"
                        value={convData}
                        onChange={(e) => setConvData(e.target.value)}
                        className="h-8 text-xs border-blue-300"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-blue-900">Hora</Label>
                      <Input
                        type="time"
                        value={convHora}
                        onChange={(e) => setConvHora(e.target.value)}
                        className="h-8 text-xs border-blue-300"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMostrarConverter(false)}
                      className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium border border-blue-300 text-blue-900 hover:bg-blue-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={converter}
                      disabled={convertendo}
                      className="flex-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {convertendo ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                      Confirmar Agendamento
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vínculo de agendamento existente */}
          {ehEdicao && agendamentoVinculado && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Este orçamento já está vinculado a um agendamento.
            </div>
          )}

          {erro && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {erro}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#e8dcc4] px-5 py-3 flex items-center justify-between gap-2">
          {ehEdicao ? (
            <button
              type="button"
              onClick={() => setConfirmarExclusao(true)}
              className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 px-2 py-1.5"
            >
              <Trash2 size={14} /> Excluir
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {ehEdicao && (
              <Button
                variant="outline"
                onClick={imprimir}
                className="border-[#B89968]/40 text-[#5a4530] hover:bg-[#faf5ee]"
              >
                <Printer size={14} className="mr-1.5" />
                Imprimir
              </Button>
            )}
            <Button
              onClick={salvar}
              disabled={salvando}
              className="bg-[#B89968] hover:bg-[#9a7d50] text-white"
            >
              {salvando ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </div>

        {/* Confirmar exclusão */}
        {confirmarExclusao && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl p-6 mx-6 shadow-xl text-center w-full max-w-xs">
              <h3 className="font-semibold text-[#5a4530] text-base mb-1">Excluir Orçamento</h3>
              <p className="text-sm text-[#9a7d50] mb-5">Você tem certeza que deseja excluir?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmarExclusao(false)}
                  className="flex-1 border border-[#e8dcc4] rounded-lg py-2.5 text-sm text-[#9a7d50] hover:bg-[#faf5ee] transition-colors font-medium"
                >
                  CANCELAR
                </button>
                <button
                  onClick={excluir}
                  disabled={excluindo}
                  className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {excluindo ? <><Loader2 size={14} className="animate-spin" /> Excluindo...</> : "SIM"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
