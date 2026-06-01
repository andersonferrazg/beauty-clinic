"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X, Plus, Trash2, Loader2, Lock, Calendar, Search, ChevronDown, Clock, ShoppingCart, RefreshCw, FileText, Copy, ExternalLink, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PickerMensagens } from "@/components/agenda/PickerMensagens";

type Profissional = { id: string; nome: string; cor: string };
type Cliente = { id: string; nome: string; telefone1: string | null };
type Servico = { id: string; nome: string; preco: number; duracaoMin: number; precoVariavel: boolean; cor: string };
type Produto = { id: string; nome: string; precoVenda: number; qtdEstoque: number };
type Status = { id: string; nome: string; cor: string };
type FormaPgto = { id: string; nome: string; percentualTaxa: number };

type ItemServico = {
  tipo: "servico" | "produto";
  servicoId: string;
  nomeServico: string;
  preco: number;
  duracaoMin: number;
};

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  dataInicial?: Date;
  horaInicial?: number;
  profissionalInicial?: string;
  agendamentoId?: string;
};

const MOTIVOS_BLOQUEIO = ["Almoço", "Médico", "Curso", "Folga", "Reunião"];
const DURACOES = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 270, 300, 360, 420, 480, 540, 600, 660, 720];

function pad(n: number) { return String(n).padStart(2, "0"); }

function dataParaLocalStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function minutosParaHora(min: number) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

function formatarDuracao(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

function calcDuracao(ini: string, fim: string): number {
  const [ih, im] = ini.split(":").map(Number);
  const [fh, fm] = fim.split(":").map(Number);
  return (fh * 60 + fm) - (ih * 60 + im);
}

function horaFimDefault(ini: string, durMin: number): string {
  const [h, m] = ini.split(":").map(Number);
  return minutosParaHora(Math.min(h * 60 + m + durMin, 23 * 60 + 59));
}

function DuracaoSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const opcoes = [...DURACOES, ...(!DURACOES.includes(value) ? [value] : [])].sort((a, b) => a - b);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((p) => !p)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-[#B89968]/30 bg-transparent px-3 py-1 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
      >
        {formatarDuracao(value)}
        <ChevronDown size={14} className="text-[#9a7d50]" />
      </button>
      {aberto && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[200] bg-white border border-[#e8dcc4] rounded-md shadow-lg max-h-48 overflow-y-auto">
          {opcoes.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { onChange(d); setAberto(false); }}
              className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-[#faf5ee] transition-colors", value === d ? "text-[#B89968] font-semibold" : "text-[#5a4530]")}
            >
              {formatarDuracao(d)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ModalAgendamento({
  aberto,
  onFechar,
  onSalvo,
  dataInicial,
  horaInicial = 9 * 60,
  profissionalInicial,
  agendamentoId,
}: Props) {
  const ehEdicao = !!agendamentoId;

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const [tipo, setTipo] = useState<"agendamento" | "bloqueio">("agendamento");

  // ── Dados ──────────────────────────────────────────────────────────────────
  const [profissionalId, setProfissionalId] = useState(profissionalInicial ?? "");
  const [clienteId, setClienteId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [statusId, setStatusId] = useState("");
  const [dataStr, setDataStr] = useState(dataParaLocalStr(dataInicial ?? new Date()));
  const [horaStr, setHoraStr] = useState(minutosParaHora(horaInicial));
  const [duracaoMin, setDuracaoMin] = useState(60);
  const [corCustom, setCorCustom] = useState("");
  const [observacao, setObservacao] = useState("");
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [horaFimBloqueio, setHoraFimBloqueio] = useState("10:00");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [itens, setItens] = useState<ItemServico[]>([]);

  // ── Listas ─────────────────────────────────────────────────────────────────
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [statusOpcoes, setStatusOpcoes] = useState<Status[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [formasPgto, setFormasPgto] = useState<FormaPgto[]>([]);
  const [erroPagamento, setErroPagamento] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([]);
  const [buscaItem, setBuscaItem] = useState<string[]>([]);
  const [itensSugeridos, setItensSugeridos] = useState<(Servico | Produto)[][]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [mostrarSugestoesItem, setMostrarSugestoesItem] = useState<boolean[]>([]);

  // ── Sessão do usuário logado ───────────────────────────────────────────────
  type SessaoSimples = { permissoes?: { isAdmin?: boolean }; profissionalId?: string | null };
  const [minhaSessao, setMinhaSessao] = useState<SessaoSimples | null>(null);

  useEffect(() => {
    fetch("/api/me/sessao").then((r) => r.json()).then(setMinhaSessao).catch(() => {});
  }, []);

  // ── Estado ─────────────────────────────────────────────────────────────────
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erro, setErro] = useState("");
  const [lancamentoId, setLancamentoId] = useState<string | null>(null);
  const [cpfCliente, setCpfCliente] = useState<string | null>(null);
  const [cnpjClinica, setCnpjClinica] = useState<string | null>(null);
  const [nomeClinica, setNomeClinica] = useState<string | null>(null);
  const [urlNFSe, setUrlNFSe] = useState<string | null>(null);
  const [mostrarNF, setMostrarNF] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [maisOpcoes, setMaisOpcoes] = useState(false);
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [mostrarPickerWA, setMostrarPickerWA] = useState(false);

  // ── Fim calculado (horário local) ──────────────────────────────────────────
  const fimCalculado = (() => {
    const d = new Date(`${dataStr}T${horaStr}`);
    d.setMinutes(d.getMinutes() + duracaoMin);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  const totalServicos = itens.reduce((s, i) => s + i.preco, 0);

  // ── Inicializar ao abrir para novo agendamento ─────────────────────────────
  useEffect(() => {
    if (aberto && !agendamentoId) {
      setDataStr(dataParaLocalStr(dataInicial ?? new Date()));
      setHoraStr(minutosParaHora(horaInicial));
      setHoraFimBloqueio(horaFimDefault(minutosParaHora(horaInicial), 60));
      const profId = profissionalInicial || (!minhaSessao?.permissoes?.isAdmin && minhaSessao?.profissionalId ? minhaSessao.profissionalId : "");
      setProfissionalId(profId ?? "");
    }
  }, [aberto, agendamentoId, dataInicial, horaInicial, profissionalInicial, minhaSessao]);

  // ── Carregar listas ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aberto) return;
    fetch("/api/profissionais").then((r) => r.json()).then((lista: Profissional[]) => {
      // Não-admin vê apenas si mesmo na lista
      if (!minhaSessao?.permissoes?.isAdmin && minhaSessao?.profissionalId) {
        setProfissionais(lista.filter((p) => p.id === minhaSessao.profissionalId));
      } else {
        setProfissionais(lista);
      }
    });
    fetch("/api/status-agenda").then((r) => r.json()).then((lista) => {
      setStatusOpcoes(lista);
      if (!statusId && lista.length) setStatusId(lista[0].id);
    });
    fetch("/api/servicos").then((r) => r.json()).then(setServicos);
    fetch("/api/produtos").then((r) => r.json()).then((data) => {
      setProdutos(Array.isArray(data) ? data : []);
    });
    fetch("/api/formas-pagamento").then((r) => r.json()).then((data) => {
      setFormasPgto(Array.isArray(data) ? data : []);
    });
  }, [aberto]);

  // ── Carregar config NF (uma vez) ───────────────────────────────────────────
  useEffect(() => {
    if (!aberto) return;
    fetch("/api/configuracoes").then((r) => r.json()).then((d) => {
      setUrlNFSe(d.config?.urlNFSe ?? null);
      setCnpjClinica(d.tenant?.cnpj ?? null);
      setNomeClinica(d.tenant?.nome ?? null);
    }).catch(() => {});
  }, [aberto]);

  // ── Carregar agendamento para edição ───────────────────────────────────────
  useEffect(() => {
    if (!aberto || !agendamentoId) return;
    fetch(`/api/agendamentos/${agendamentoId}`)
      .then((r) => r.json())
      .then((ag) => {
        setProfissionalId(ag.profissionalId);
        setClienteId(ag.clienteId ?? "");
        setClienteNome(ag.cliente?.nome ?? "");
        setClienteTelefone(ag.cliente?.telefone1 ?? "");
        setCpfCliente(ag.cliente?.cpf ?? null);
        setLancamentoId(ag.lancamentoId ?? null);
        setStatusId(ag.statusId ?? "");
        const d = new Date(ag.inicio);
        setDataStr(dataParaLocalStr(d));
        setHoraStr(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
        setObservacao(ag.observacao ?? "");
        setFormaPagamento(ag.formaPagamento ?? "");
        setMotivoBloqueio(ag.motivoBloqueio ?? "");
        setItens(
          ag.itens.map((i: { servicoId: string; servico: { nome: string; duracaoMin: number }; preco: number }) => ({
            tipo: "servico" as const,
            servicoId: i.servicoId,
            nomeServico: i.servico.nome,
            preco: i.preco,
            duracaoMin: i.servico.duracaoMin,
          }))
        );
        const fim = new Date(ag.fim);
        const dur = (fim.getTime() - new Date(ag.inicio).getTime()) / 60000;
        setDuracaoMin(dur);
        setHoraFimBloqueio(`${pad(fim.getHours())}:${pad(fim.getMinutes())}`);
      });
  }, [aberto, agendamentoId]);

  // ── Reset ao fechar ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aberto) {
      setTipo("agendamento");
      setClienteId("");
      setClienteNome("");
      setBuscaCliente("");
      setItens([]);
      setBuscaItem([]);
      setItensSugeridos([]);
      setMostrarSugestoesItem([]);
      setObservacao("");
      setMotivoBloqueio("");
      setDiaInteiro(false);
      setHoraFimBloqueio("10:00");
      setFormaPagamento("");
      setCorCustom("");
      setErro("");
      setMaisOpcoes(false);
      setConfirmarExclusao(false);
      setDuracaoMin(60);
      setLancamentoId(null);
      setCpfCliente(null);
      setMostrarNF(false);
      setCopiado(null);
      setClienteTelefone("");
      setMostrarPickerWA(false);
    }
  }, [aberto]);

  // ── Busca de cliente ───────────────────────────────────────────────────────
  useEffect(() => {
    if (buscaCliente.length < 2) { setClientesSugeridos([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/clientes?q=${encodeURIComponent(buscaCliente)}`)
        .then((r) => r.json())
        .then(setClientesSugeridos);
    }, 300);
    return () => clearTimeout(t);
  }, [buscaCliente]);

  // ── Busca de serviço/produto por linha ─────────────────────────────────────
  const buscarItem = useCallback(
    (idx: number, termo: string, tipoItem: "servico" | "produto") => {
      const lista = tipoItem === "servico"
        ? servicos.filter((s) => s.nome.toLowerCase().includes(termo.toLowerCase()))
        : produtos.filter((p) => p.nome.toLowerCase().includes(termo.toLowerCase()));
      setItensSugeridos((prev) => {
        const nova = [...prev];
        nova[idx] = lista.slice(0, 8);
        return nova;
      });
    },
    [servicos, produtos]
  );

  function adicionarItem(tipoItem: "servico" | "produto") {
    setItens((prev) => [...prev, { tipo: tipoItem, servicoId: "", nomeServico: "", preco: 0, duracaoMin: 30 }]);
    setBuscaItem((prev) => [...prev, ""]);
    setMostrarSugestoesItem((prev) => [...prev, true]);
    setItensSugeridos((prev) => {
      const nova = [...prev, tipoItem === "servico" ? servicos.slice(0, 8) : produtos.slice(0, 8)];
      return nova;
    });
  }

  function removerItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
    setBuscaItem((prev) => prev.filter((_, i) => i !== idx));
    setMostrarSugestoesItem((prev) => prev.filter((_, i) => i !== idx));
    setItensSugeridos((prev) => prev.filter((_, i) => i !== idx));
  }

  function selecionarServico(idx: number, servico: Servico) {
    setItens((prev) => {
      const nova = [...prev];
      nova[idx] = { tipo: "servico", servicoId: servico.id, nomeServico: servico.nome, preco: servico.preco, duracaoMin: servico.duracaoMin };
      return nova;
    });
    setBuscaItem((prev) => { const n = [...prev]; n[idx] = servico.nome; return n; });
    setMostrarSugestoesItem((prev) => { const n = [...prev]; n[idx] = false; return n; });
    const novasDuracoes = itens.map((item, i) => i === idx ? servico.duracaoMin : item.duracaoMin);
    const totalDur = novasDuracoes.reduce((s, d) => s + d, 0);
    setDuracaoMin(totalDur || 60);
  }

  function selecionarProduto(idx: number, produto: Produto) {
    setItens((prev) => {
      const nova = [...prev];
      nova[idx] = { tipo: "produto", servicoId: produto.id, nomeServico: produto.nome, preco: produto.precoVenda, duracaoMin: 0 };
      return nova;
    });
    setBuscaItem((prev) => { const n = [...prev]; n[idx] = produto.nome; return n; });
    setMostrarSugestoesItem((prev) => { const n = [...prev]; n[idx] = false; return n; });
  }

  function atualizarPrecoItem(idx: number, preco: number) {
    setItens((prev) => { const n = [...prev]; n[idx] = { ...n[idx], preco }; return n; });
  }

  async function salvar() {
    if (!profissionalId) { setErro("Selecione a profissional."); return; }
    if (tipo === "agendamento" && !clienteId) { setErro("Selecione a cliente."); return; }
    if (tipo === "agendamento" && itens.length === 0) { setErro("Adicione pelo menos um serviço."); return; }
    // Forma de pagamento obrigatória ao finalizar
    const statusFinalizado = statusOpcoes.find((s) => s.nome === "Finalizado");
    if (tipo === "agendamento" && statusId && statusFinalizado && statusId === statusFinalizado.id && !formaPagamento) {
      setErroPagamento(true);
      setErro("Selecione a forma de pagamento para finalizar o atendimento.");
      return;
    }
    setErroPagamento(false);
    setErro("");
    setSalvando(true);

    try {
      const inicioISO = new Date(`${dataStr}T${horaStr}`).toISOString();
      const fimDate = new Date(`${dataStr}T${horaStr}`);
      fimDate.setMinutes(fimDate.getMinutes() + duracaoMin);
      const fimISO = fimDate.toISOString();

      const url = ehEdicao ? `/api/agendamentos/${agendamentoId}` : "/api/agendamentos";
      const method = ehEdicao ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          profissionalId,
          clienteId: tipo === "agendamento" ? clienteId : null,
          statusId: statusId || null,
          inicio: inicioISO,
          fim: fimISO,
          corCustom: corCustom || null,
          observacao: tipo === "agendamento" ? observacao : null,
          motivoBloqueio: tipo === "bloqueio" ? motivoBloqueio : null,
          formaPagamento: formaPagamento || null,
          valorTotal: totalServicos || null,
          itens: tipo === "agendamento"
            ? itens.filter((i) => i.tipo === "servico").map(({ servicoId, preco }) => ({ servicoId, preco }))
            : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
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
    if (!agendamentoId) return;
    setExcluindo(true);
    await fetch(`/api/agendamentos/${agendamentoId}`, { method: "DELETE" });
    setExcluindo(false);
    onSalvo();
    onFechar();
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onFechar} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92dvh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-base font-semibold text-[#5a4530]">
              {ehEdicao ? "Editando Atendimento" : "Criando Atendimento"}
            </h2>
          </div>
          {/* Toggle Agendamento / Bloqueio */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  checked={tipo === "agendamento"}
                  onChange={() => setTipo("agendamento")}
                  className="accent-[#B89968]"
                />
                <Calendar size={13} className="text-[#B89968]" />
                <span className="text-[#5a4530] font-medium">Agendamento</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  checked={tipo === "bloqueio"}
                  onChange={() => setTipo("bloqueio")}
                  className="accent-[#B89968]"
                />
                <Lock size={13} className="text-[#9a7d50]" />
                <span className="text-[#5a4530] font-medium">Bloqueio</span>
              </label>
            </div>
            <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530] ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* Data + (Hora + Cor só para agendamento) */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-[#5a4530]">Data</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={dataStr}
                  onChange={(e) => setDataStr(e.target.value)}
                  className="border-[#B89968]/30 pr-8"
                />
                <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9a7d50] pointer-events-none" />
              </div>
            </div>
            {tipo === "agendamento" && (
              <div className="min-w-[8rem] flex-shrink-0 space-y-1.5">
                <Label className="text-[#5a4530]">Hora Início</Label>
                <div className="relative">
                  <Input
                    type="time"
                    value={horaStr}
                    onChange={(e) => setHoraStr(e.target.value)}
                    className="border-[#B89968]/30"
                  />
                </div>
              </div>
            )}
            {tipo === "agendamento" && (
              <div className="space-y-1.5 flex-shrink-0">
                <Label className="text-[#5a4530]">Cor</Label>
                <label className="cursor-pointer block">
                  <div
                    className="w-9 h-9 rounded-full border-2 border-[#e8dcc4] shadow-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: corCustom || "#B89968" }}
                  />
                  <input
                    type="color"
                    value={corCustom || "#B89968"}
                    onChange={(e) => setCorCustom(e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Profissional */}
          <div className="space-y-1.5">
            <Label className="text-[#5a4530]">Profissional</Label>
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              disabled={!minhaSessao?.permissoes?.isAdmin && !!minhaSessao?.profissionalId}
              className="flex h-9 w-full rounded-md border border-[#B89968]/30 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89968] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Selecionar profissional...</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* AGENDAMENTO: Cliente + serviços */}
          {tipo === "agendamento" && (
            <>
              {/* Cliente */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[#5a4530]">Cliente</Label>
                  <button
                    type="button"
                    onClick={async () => {
                      const nome = window.prompt("Nome da nova cliente:");
                      if (!nome) return;
                      const tel = window.prompt("Telefone (opcional):") ?? "";
                      const res = await fetch("/api/clientes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ nome, telefone1: tel || null }),
                      });
                      const nova = await res.json();
                      setClienteId(nova.id);
                      setClienteNome(nova.nome);
                      setClienteTelefone(nova.telefone1 ?? "");
                      setBuscaCliente(nova.nome);
                    }}
                    className="text-xs text-[#B89968] border border-[#B89968]/40 px-2.5 py-0.5 rounded-md hover:bg-[#B89968]/10 transition-colors font-medium"
                  >
                    ADICIONAR CLIENTE
                  </button>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7d50]" />
                  <Input
                    value={clienteId ? clienteNome : buscaCliente}
                    onChange={(e) => {
                      if (clienteId) { setClienteId(""); setClienteNome(""); }
                      setBuscaCliente(e.target.value);
                      setMostrarSugestoes(true);
                    }}
                    onFocus={() => setMostrarSugestoes(true)}
                    onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
                    placeholder="Digite para buscar..."
                    className="pl-9 border-[#B89968]/30"
                  />
                  {mostrarSugestoes && clientesSugeridos.length > 0 && (
                    <div className="absolute z-20 w-full bg-white border border-[#e8dcc4] rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {clientesSugeridos.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#faf5ee] transition-colors"
                          onMouseDown={() => {
                            setClienteId(c.id);
                            setClienteNome(c.nome);
                            setClienteTelefone(c.telefone1 ?? "");
                            setBuscaCliente(c.nome);
                            setMostrarSugestoes(false);
                          }}
                        >
                          <span className="font-medium text-[#5a4530]">{c.nome}</span>
                          {c.telefone1 && <span className="text-[#9a7d50] ml-2 text-xs">{c.telefone1}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Link prontuário */}
              {clienteId && (
                <a
                  href={`/prontuarios/${clienteId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#B89968] hover:text-[#9a7d50] font-medium w-fit"
                >
                  <FileText size={12} />
                  Ver Prontuário de {clienteNome.split(" ")[0]}
                </a>
              )}

              {/* Serviços / Produtos */}
              <div className="space-y-2">
                <Label className="text-[#5a4530]">Serviços</Label>
                {itens.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="relative flex-1">
                      <Input
                        value={buscaItem[idx] ?? item.nomeServico}
                        onChange={(e) => {
                          const novas = [...buscaItem];
                          novas[idx] = e.target.value;
                          setBuscaItem(novas);
                          buscarItem(idx, e.target.value, item.tipo);
                          const show = [...mostrarSugestoesItem];
                          show[idx] = true;
                          setMostrarSugestoesItem(show);
                        }}
                        onFocus={() => {
                          buscarItem(idx, buscaItem[idx] ?? "", item.tipo);
                          const show = [...mostrarSugestoesItem];
                          show[idx] = true;
                          setMostrarSugestoesItem(show);
                        }}
                        onBlur={() => setTimeout(() => {
                          const show = [...mostrarSugestoesItem];
                          show[idx] = false;
                          setMostrarSugestoesItem(show);
                        }, 150)}
                        placeholder={item.tipo === "produto" ? "Buscar produto..." : "Buscar serviço..."}
                        className="border-[#B89968]/30 text-sm"
                      />
                      {item.tipo === "produto" && (
                        <ShoppingCart size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9a7d50] pointer-events-none" />
                      )}
                      {mostrarSugestoesItem[idx] && (itensSugeridos[idx]?.length ?? 0) > 0 && (
                        <div className="absolute z-20 w-full bg-white border border-[#e8dcc4] rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto">
                          {itensSugeridos[idx].map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-[#faf5ee]"
                              onMouseDown={() => {
                                if (item.tipo === "servico") {
                                  selecionarServico(idx, s as Servico);
                                } else {
                                  selecionarProduto(idx, s as Produto);
                                }
                              }}
                            >
                              <span className="font-medium text-[#5a4530]">{s.nome}</span>
                              <span className="text-[#9a7d50] ml-2 text-xs">
                                R$ {(s as Servico).preco !== undefined
                                  ? (s as Servico).preco.toFixed(2).replace(".", ",")
                                  : (s as Produto).precoVenda.toFixed(2).replace(".", ",")}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-28 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9a7d50] text-xs">R$</span>
                      <Input
                        type="number"
                        value={item.preco}
                        onChange={(e) => atualizarPrecoItem(idx, Number(e.target.value))}
                        onFocus={(e) => e.currentTarget.select()}
                        className="pl-7 border-[#B89968]/30 text-sm"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removerItem(idx)}
                      className="mt-1.5 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {/* Botões adicionar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => adicionarItem("servico")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-green-700 border border-green-600/50 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <Plus size={12} />
                    ADICIONAR SERVIÇO
                  </button>
                  <button
                    type="button"
                    onClick={() => adicionarItem("produto")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-green-700 border border-green-600/50 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <ShoppingCart size={12} />
                    ADICIONAR PRODUTO
                  </button>
                  {itens.length > 0 && (
                    <span className="ml-auto text-sm font-semibold text-[#5a4530]">
                      Total: R$ {totalServicos.toFixed(2).replace(".", ",")}
                    </span>
                  )}
                </div>
              </div>

              {/* Duração */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[#5a4530]">
                    Duração{" "}
                    <span className="text-[#9a7d50] font-normal text-xs">(valor padrão baseado no serviço)</span>
                  </Label>
                  <span className="text-xs text-[#9a7d50]">Término: {fimCalculado}</span>
                </div>
                <DuracaoSelect value={duracaoMin} onChange={setDuracaoMin} />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-[#5a4530]">Status</Label>
                <div className="flex flex-wrap gap-1.5">
                  {statusOpcoes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatusId(s.id)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                        statusId === s.id
                          ? "text-white border-transparent"
                          : "bg-transparent text-[#5a4530] border-[#e8dcc4] hover:border-[#B89968]/50"
                      )}
                      style={statusId === s.id ? { backgroundColor: s.cor, borderColor: s.cor } : {}}
                    >
                      {s.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repetir agendamento */}
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-[#e8dcc4] text-sm text-[#B89968] font-medium hover:border-[#B89968]/50 hover:bg-[#faf5ee] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} />
                  Repetir Agendamento:
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Não Repete</span>
                  <ChevronDown size={14} />
                </div>
              </button>
            </>
          )}

          {/* BLOQUEIO: motivo */}
          {tipo === "bloqueio" && (
            <div className="space-y-2">
              <Label className="text-[#5a4530]">Motivo</Label>
              <Input
                value={motivoBloqueio}
                onChange={(e) => setMotivoBloqueio(e.target.value)}
                placeholder="Descreva o motivo (opcional)..."
                className="border-[#B89968]/30"
              />
              <div className="flex flex-wrap gap-1.5">
                {MOTIVOS_BLOQUEIO.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMotivoBloqueio(m)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs border transition-colors",
                      motivoBloqueio === m
                        ? "bg-[#B89968] text-white border-[#B89968]"
                        : "border-[#e8dcc4] text-[#9a7d50] hover:border-[#B89968]/50"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Hora Início e Hora Fim (oculta quando Dia Inteiro) */}
              {!diaInteiro && (
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-[#5a4530]">Hora Início</Label>
                    <Input
                      type="time"
                      value={horaStr}
                      onChange={(e) => {
                        setHoraStr(e.target.value);
                        const dur = calcDuracao(e.target.value, horaFimBloqueio);
                        if (dur > 0) setDuracaoMin(dur);
                      }}
                      className="border-[#B89968]/30"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-[#5a4530]">Hora Fim</Label>
                    <Input
                      type="time"
                      value={horaFimBloqueio}
                      onChange={(e) => {
                        setHoraFimBloqueio(e.target.value);
                        const dur = calcDuracao(horaStr, e.target.value);
                        if (dur > 0) setDuracaoMin(dur);
                      }}
                      className="border-[#B89968]/30"
                    />
                  </div>
                </div>
              )}

              {/* Dia Inteiro toggle */}
              <div className="flex items-center justify-between pt-1">
                <Label className="text-[#5a4530]">Dia Inteiro</Label>
                <button
                  type="button"
                  onClick={() => {
                    const novo = !diaInteiro;
                    setDiaInteiro(novo);
                    if (novo) {
                      setHoraStr("00:00");
                      setHoraFimBloqueio("23:59");
                      setDuracaoMin(1439);
                    } else {
                      const fim = horaFimDefault(horaStr, 60);
                      setHoraFimBloqueio(fim);
                      setDuracaoMin(60);
                    }
                  }}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    diaInteiro ? "bg-[#B89968]" : "bg-[#e8dcc4]"
                  )}
                >
                  <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow", diaInteiro ? "translate-x-4" : "translate-x-1")} />
                </button>
              </div>
            </div>
          )}

          {/* Mais campos */}
          {tipo === "agendamento" && (
            <div>
              <button
                type="button"
                onClick={() => setMaisOpcoes(!maisOpcoes)}
                className="flex items-center gap-1.5 text-sm text-[#B89968] hover:text-[#9a7d50]"
              >
                <ChevronDown size={14} className={cn("transition-transform", maisOpcoes && "rotate-180")} />
                Mais campos (Observação, outros...)
              </button>

              {maisOpcoes && (
                <div className="mt-3 space-y-3">
                  <div className={cn("space-y-1.5", erroPagamento && "rounded-lg border border-red-300 bg-red-50/50 p-2")}>
                    <Label className={cn("text-[#5a4530]", erroPagamento && "text-red-600")}>
                      Forma de Pagamento
                      {erroPagamento && <span className="ml-1 text-xs font-normal text-red-500">— obrigatória para finalizar</span>}
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {formasPgto.map((f) => {
                        const taxa = formaPagamento === f.nome && f.percentualTaxa > 0
                          ? totalServicos * (f.percentualTaxa / 100)
                          : 0;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => { setFormaPagamento(formaPagamento === f.nome ? "" : f.nome); setErroPagamento(false); }}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs border transition-colors",
                              formaPagamento === f.nome
                                ? "bg-[#B89968] text-white border-[#B89968]"
                                : "border-[#e8dcc4] text-[#9a7d50] hover:border-[#B89968]/50"
                            )}
                          >
                            {f.nome}
                            {f.percentualTaxa > 0 && <span className="ml-1 opacity-70">{f.percentualTaxa}%</span>}
                          </button>
                        );
                      })}
                    </div>
                    {(() => {
                      const forma = formasPgto.find((f) => f.nome === formaPagamento);
                      if (!forma || forma.percentualTaxa === 0 || totalServicos === 0) return null;
                      const taxa = totalServicos * (forma.percentualTaxa / 100);
                      const liquido = totalServicos - taxa;
                      return (
                        <p className="text-xs text-[#9a7d50]">
                          Taxa {forma.percentualTaxa}%: <span className="text-red-400">−R$ {taxa.toFixed(2).replace(".", ",")}</span> →
                          Líquido: <span className="font-semibold text-[#5a4530]">R$ {liquido.toFixed(2).replace(".", ",")}</span>
                        </p>
                      );
                    })()}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[#5a4530]">Observação</Label>
                    <textarea
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Observações sobre o atendimento..."
                      rows={2}
                      className="flex w-full rounded-md border border-[#B89968]/30 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89968] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Painel Emitir NF — só aparece quando atendimento está finalizado */}
          {lancamentoId && (
            <div className="rounded-xl border border-[#e8dcc4] overflow-hidden">
              <button
                type="button"
                onClick={() => setMostrarNF((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-[#faf5ee] hover:bg-[#f0e8d5] transition-colors text-sm font-medium text-[#5a4530]"
              >
                <span className="flex items-center gap-2">
                  <FileText size={14} className="text-[#B89968]" />
                  Emitir Nota Fiscal
                </span>
                <span className="text-xs text-[#9a7d50]">{mostrarNF ? "▲ fechar" : "▼ ver dados"}</span>
              </button>

              {mostrarNF && (
                <div className="px-4 py-3 space-y-3 bg-white">
                  <p className="text-xs text-[#9a7d50]">Copie os dados abaixo e preencha no sistema de NF do seu contador.</p>

                  {[
                    { label: "Tomador (Cliente)", value: clienteNome },
                    { label: "CPF do Cliente", value: cpfCliente ?? "Não cadastrado" },
                    { label: "Prestador (Clínica)", value: nomeClinica ?? "" },
                    { label: "CNPJ da Clínica", value: cnpjClinica ?? "Não cadastrado" },
                    { label: "Serviços", value: itens.filter(i => i.tipo === "servico").map(i => i.nomeServico).join(", ") || "—" },
                    { label: "Valor Total", value: `R$ ${itens.filter(i=>i.tipo==="servico").reduce((s,i)=>s+i.preco,0).toFixed(2).replace(".",",")}` },
                    { label: "Data do Atendimento", value: dataStr ? new Date(dataStr + "T12:00").toLocaleDateString("pt-BR") : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#9a7d50] uppercase tracking-wide">{label}</p>
                        <p className="text-sm text-[#5a4530] font-medium truncate">{value}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(value); setCopiado(label); setTimeout(() => setCopiado(null), 1500); }}
                        className="p-1.5 rounded hover:bg-[#faf5ee] text-[#9a7d50] hover:text-[#B89968] flex-shrink-0 transition-colors"
                        title="Copiar"
                      >
                        {copiado === label ? <span className="text-xs text-green-600">✓</span> : <Copy size={13} />}
                      </button>
                    </div>
                  ))}

                  {urlNFSe && (
                    <a
                      href={urlNFSe.startsWith("http") ? urlNFSe : `https://${urlNFSe}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full mt-2 py-2 rounded-lg bg-[#B89968] hover:bg-[#9a7d50] text-white text-sm font-medium transition-colors"
                    >
                      <ExternalLink size={14} />
                      Abrir sistema de NF
                    </a>
                  )}
                  {!urlNFSe && (
                    <p className="text-xs text-[#9a7d50] text-center">Configure o link do sistema de NF em <strong>Configurações → Dados da Clínica</strong>.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {erro}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-1 items-center">
            {ehEdicao && (
              <button
                type="button"
                onClick={() => setConfirmarExclusao(true)}
                className="p-2 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                title="Excluir agendamento"
              >
                <Trash2 size={16} />
              </button>
            )}
            {tipo === "agendamento" && clienteId && clienteTelefone && (
              <button
                type="button"
                onClick={() => setMostrarPickerWA(true)}
                className="p-2 text-[#25D366] hover:bg-[#25D366]/10 rounded-md transition-colors flex-shrink-0"
                title="Enviar mensagem via WhatsApp"
              >
                <MessageSquare size={16} />
              </button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onFechar}
              className="flex-1 border-[#e8dcc4] text-[#9a7d50]"
            >
              FECHAR
            </Button>
            <Button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="flex-1 bg-[#B89968] hover:bg-[#9a7d50] text-white"
            >
              {salvando ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : "SALVAR"}
            </Button>
          </div>
        </div>
      </div>

      {/* Picker de mensagens WhatsApp */}
      {mostrarPickerWA && (
        <PickerMensagens
          dados={{
            clienteNome: clienteNome,
            dataStr: dataStr,
            horaInicio: horaStr,
            horaFim: fimCalculado,
            servicos: itens.map((i) => i.nomeServico).filter(Boolean),
            profissionalNome: profissionais.find((p) => p.id === profissionalId)?.nome,
            nomeClinica: nomeClinica ?? undefined,
            valorTotal: totalServicos,
          }}
          telefone={clienteTelefone}
          onFechar={() => setMostrarPickerWA(false)}
        />
      )}

      {/* Confirmação de exclusão — overlay sobre o modal inteiro, fora do scroll */}
      {confirmarExclusao && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 mx-6 shadow-xl text-center w-full max-w-xs">
            <h3 className="font-semibold text-[#5a4530] text-base mb-1">Excluir Agendamento</h3>
            <p className="text-sm text-[#9a7d50] mb-5">Você tem certeza que deseja deletar?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmarExclusao(false)}
                className="flex-1 border border-[#e8dcc4] rounded-lg py-2.5 text-sm text-[#9a7d50] hover:bg-[#faf5ee] transition-colors font-medium"
              >
                CANCELAR
              </button>
              <button
                type="button"
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
  );
}
