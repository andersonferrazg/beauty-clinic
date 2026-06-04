"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, CheckCircle2, Clock, DollarSign, Pencil, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";

type Profissional = { id: string; nome: string; cor: string };

type Comissao = {
  id: string;
  valorBase: number;
  percentual: number | null;
  valorComissao: number;
  pago: boolean;
  pagoEm: string | null;
  criadoEm: string;
  direcaoComissao: string;
  profissional: Profissional;
  lancamento: {
    id: string;
    valor: number;
    pagoEm: string | null;
    descricao: string;
    agendamento: {
      id: string;
      inicio: string;
      cliente: { id: string; nome: string } | null;
    } | null;
  };
};

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatarData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function toInputDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type ModalEditarProps = {
  comissao: Comissao;
  onFechar: () => void;
  onSalvo: () => void;
};

function ModalEditar({ comissao, onFechar, onSalvo }: ModalEditarProps) {
  const [percentual, setPercentual] = useState(comissao.percentual?.toString() ?? "");
  const [valor, setValor] = useState(comissao.valorComissao.toFixed(2));
  const [pago, setPago] = useState(comissao.pago);
  const [pagoEm, setPagoEm] = useState(toInputDate(comissao.pagoEm));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function handlePercentualChange(v: string) {
    setPercentual(v);
    const pct = parseFloat(v);
    if (!isNaN(pct) && pct >= 0) {
      setValor((comissao.valorBase * (pct / 100)).toFixed(2));
    }
  }

  async function salvar() {
    if (!valor || isNaN(parseFloat(valor))) { setErro("Valor inválido"); return; }
    setSalvando(true);
    setErro("");
    try {
      const r = await fetch(`/api/comissoes/${comissao.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          percentual: percentual ? parseFloat(percentual) : null,
          valorComissao: parseFloat(valor),
          pago,
          pagoEm: pago && pagoEm ? pagoEm : null,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.erro ?? `HTTP ${r.status}`);
      }
      onSalvo();
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  const cliente = comissao.lancamento.agendamento?.cliente?.nome ?? comissao.lancamento.descricao;
  const data = formatarData(comissao.lancamento.agendamento?.inicio ?? comissao.criadoEm);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4]">
          <h2 className="text-base font-serif font-semibold text-[#5a4530]">Editar Comissão</h2>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-5 space-y-4">
          {/* Info */}
          <div className="bg-[#faf5ee] rounded-lg px-3 py-2 text-sm text-[#5a4530]">
            <p className="font-medium">{comissao.profissional.nome}</p>
            <p className="text-xs text-[#9a7d50]">{data} · {cliente} · base {fmt(comissao.valorBase)}</p>
          </div>

          {/* % e Valor lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9a7d50] block mb-1">Percentual (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentual}
                onChange={(e) => handlePercentualChange(e.target.value)}
                placeholder="Ex: 30"
                className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              />
            </div>
            <div>
              <label className="text-xs text-[#9a7d50] block mb-1">Valor comissão (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs text-[#9a7d50] block mb-1">Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPago(false)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium border transition-colors",
                  !pago ? "bg-amber-500 text-white border-amber-500" : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-amber-300"
                )}
              >
                Pendente
              </button>
              <button
                onClick={() => setPago(true)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium border transition-colors",
                  pago ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-emerald-300"
                )}
              >
                {comissao.direcaoComissao === "COLABORADORA_PAGA" ? "Recebido" : "Pago"}
              </button>
            </div>
          </div>

          {/* Data pagamento */}
          {pago && (
            <div>
              <label className="text-xs text-[#9a7d50] block mb-1">Data do pagamento</label>
              <input
                type="date"
                value={pagoEm}
                onChange={(e) => setPagoEm(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              />
            </div>
          )}

          {erro && <p className="text-xs text-red-500">{erro}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e8dcc4] flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onFechar}>Cancelar</Button>
          <Button
            size="sm"
            onClick={salvar}
            disabled={salvando}
            className="bg-[#B89968] hover:bg-[#9a7d50] text-white"
          >
            {salvando ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ComissoesPage() {
  const [mes, setMes] = useState(mesAtual());
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [profissionalId, setProfissionalId] = useState<string>("");
  const [filtroPago, setFiltroPago] = useState<"todos" | "pendente" | "pago">("pendente");
  const [carregando, setCarregando] = useState(true);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [pagando, setPagando] = useState(false);
  const [editando, setEditando] = useState<Comissao | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  async function carregar() {
    setCarregando(true);
    const params = new URLSearchParams({ mes });
    if (profissionalId) params.set("profissionalId", profissionalId);
    if (filtroPago !== "todos") params.set("pago", filtroPago === "pago" ? "true" : "false");
    const r = await fetch(`/api/comissoes?${params}`);
    setComissoes(await r.json());
    setCarregando(false);
  }

  useEffect(() => {
    fetch("/api/me/sessao")
      .then((r) => r.json())
      .then((s) => setIsAdmin(s?.permissoes?.isAdmin ?? false));
    fetch("/api/profissionais").then((r) => r.json()).then(setProfissionais);
  }, []);

  useEffect(() => {
    carregar();
    setSelecionadas(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, profissionalId, filtroPago]);

  const grupos = useMemo(() => {
    const map: Record<string, { profissional: Profissional; comissoes: Comissao[] }> = {};
    for (const c of comissoes) {
      const id = c.profissional.id;
      if (!map[id]) map[id] = { profissional: c.profissional, comissoes: [] };
      map[id].comissoes.push(c);
    }
    return Object.values(map);
  }, [comissoes]);

  function toggleSel(id: string) {
    const novo = new Set(selecionadas);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    setSelecionadas(novo);
  }

  function toggleProfissional(comissoesProf: Comissao[]) {
    const pendentes = comissoesProf.filter((c) => !c.pago);
    const todasSelecionadas = pendentes.every((c) => selecionadas.has(c.id));
    const novo = new Set(selecionadas);
    if (todasSelecionadas) {
      for (const c of pendentes) novo.delete(c.id);
    } else {
      for (const c of pendentes) novo.add(c.id);
    }
    setSelecionadas(novo);
  }

  async function pagarSelecionadas() {
    if (selecionadas.size === 0) return;
    setPagando(true);
    const r = await fetch("/api/comissoes/pagar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selecionadas) }),
    });
    setPagando(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      alert(e.erro ?? "Erro ao pagar comissões");
      return;
    }
    setSelecionadas(new Set());
    await carregar();
  }

  function exportarCSV() {
    const linhas = [["Profissional", "Data", "Cliente", "Valor Atend. (R$)", "% Comissão", "Comissão (R$)", "Status", "Pago em"]];
    for (const c of comissoes) {
      linhas.push([
        c.profissional.nome,
        formatarData(c.lancamento.agendamento?.inicio ?? c.criadoEm),
        c.lancamento.agendamento?.cliente?.nome ?? c.lancamento.descricao,
        c.valorBase.toFixed(2),
        c.percentual ? c.percentual.toString() : "",
        c.valorComissao.toFixed(2),
        c.pago
          ? (c.direcaoComissao === "COLABORADORA_PAGA" ? "Recebido" : "Pago")
          : (c.direcaoComissao === "COLABORADORA_PAGA" ? "A receber" : "Pendente"),
        c.pagoEm ? formatarData(c.pagoEm) : "",
      ]);
    }
    const csv = "﻿" + linhas.map((l) => l.map((v) => `"${v}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `comissoes-${mes}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const totalSelecionado = comissoes
    .filter((c) => selecionadas.has(c.id))
    .reduce((s, c) => s + c.valorComissao, 0);

  const totalPendente = comissoes.filter((c) => !c.pago).reduce((s, c) => s + c.valorComissao, 0);
  const totalPago = comissoes.filter((c) => c.pago).reduce((s, c) => s + c.valorComissao, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {editando && (
        <ModalEditar
          comissao={editando}
          onFechar={() => setEditando(null)}
          onSalvo={() => { setEditando(null); carregar(); }}
        />
      )}

      {/* Header */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-[#5a4530] flex items-center gap-2">
            <Wallet size={22} className="text-[#B89968]" />
            Comissões
          </h1>
          <p className="text-sm text-[#9a7d50]">Extrato e pagamento de comissões por profissional</p>
        </div>
        {!carregando && comissoes.length > 0 && (
          <button
            onClick={exportarCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] hover:bg-[#faf5ee] transition-colors"
          >
            <Download size={14} /> Exportar CSV
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 mb-5 flex items-end gap-3 flex-wrap">
        <div>
          <label className="text-xs text-[#9a7d50] block mb-1">Mês</label>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="h-9 px-2 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
          />
        </div>
        {isAdmin && (
          <div>
            <label className="text-xs text-[#9a7d50] block mb-1">Profissional</label>
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              className="h-9 px-2 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] bg-white focus:outline-none focus:ring-2 focus:ring-[#B89968]"
            >
              <option value="">Todas</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs text-[#9a7d50] block mb-1">Status</label>
          <div className="flex gap-1">
            {(["pendente", "pago", "todos"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFiltroPago(s)}
                className={cn(
                  "px-3 h-9 rounded-md text-sm font-medium transition-colors capitalize",
                  filtroPago === s
                    ? "bg-[#B89968] text-white"
                    : "bg-[#faf5ee] text-[#9a7d50] hover:bg-[#e8dcc4]",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-amber-500" />
            <span className="text-xs text-[#9a7d50] uppercase tracking-wider">Pendente</span>
          </div>
          <p className="text-2xl font-semibold text-amber-600">{fmt(totalPendente)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-xs text-[#9a7d50] uppercase tracking-wider">Pago</span>
          </div>
          <p className="text-2xl font-semibold text-emerald-600">{fmt(totalPago)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-[#B89968]" />
            <span className="text-xs text-[#9a7d50] uppercase tracking-wider">Selecionado</span>
          </div>
          <p className="text-2xl font-semibold text-[#5a4530]">{fmt(totalSelecionado)}</p>
        </div>
      </div>

      {/* Botão pagar em massa */}
      {selecionadas.size > 0 && (
        <div className="mb-4 flex items-center justify-between bg-[#faf5ee] border border-[#B89968]/40 rounded-xl px-4 py-3">
          <span className="text-sm text-[#5a4530]">
            <strong>{selecionadas.size}</strong> comissão(ões) selecionada(s) — total {fmt(totalSelecionado)}
          </span>
          <Button
            onClick={pagarSelecionadas}
            disabled={pagando}
            className="bg-[#B89968] hover:bg-[#9a7d50] text-white"
          >
            {pagando ? <><Loader2 size={14} className="animate-spin mr-1" />Pagando...</> : "Marcar como pago"}
          </Button>
        </div>
      )}

      {/* Listagem agrupada */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#B89968]" />
        </div>
      ) : grupos.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e8dcc4] py-16 text-center text-[#9a7d50]">
          <Wallet size={32} strokeWidth={1} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma comissão encontrada no período.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map(({ profissional, comissoes: lista }) => {
            const totalProf = lista.reduce((s, c) => s + c.valorComissao, 0);
            const pendentesProf = lista.filter((c) => !c.pago);
            const todasSelecionadas =
              pendentesProf.length > 0 && pendentesProf.every((c) => selecionadas.has(c.id));

            return (
              <div key={profissional.id} className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
                {/* Header da profissional */}
                <div className="px-4 py-3 border-b border-[#e8dcc4] flex items-center justify-between bg-[#faf5ee]/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: profissional.cor }}
                    >
                      {profissional.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[#5a4530]">{profissional.nome}</p>
                      <p className="text-xs text-[#9a7d50]">
                        {lista.length} atendimento{lista.length > 1 ? "s" : ""} — total {fmt(totalProf)}
                      </p>
                    </div>
                  </div>
                  {pendentesProf.length > 0 && (
                    <button
                      onClick={() => toggleProfissional(lista)}
                      className="text-xs text-[#B89968] hover:text-[#9a7d50] font-medium"
                    >
                      {todasSelecionadas ? "Desmarcar todas" : "Selecionar pendentes"}
                    </button>
                  )}
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#faf5ee]/30 text-[#9a7d50] text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2 w-8"></th>
                        <th className="px-3 py-2 text-left">Data</th>
                        <th className="px-3 py-2 text-left">Cliente</th>
                        <th className="px-3 py-2 text-right">Valor atend.</th>
                        <th className="px-3 py-2 text-right">%</th>
                        <th className="px-3 py-2 text-right">Comissão</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((c) => (
                        <tr key={c.id} className="border-t border-[#e8dcc4]/50 hover:bg-[#faf5ee]/40">
                          <td className="px-3 py-2">
                            {!c.pago && (
                              <input
                                type="checkbox"
                                checked={selecionadas.has(c.id)}
                                onChange={() => toggleSel(c.id)}
                                className="accent-[#B89968]"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 text-[#5a4530]">
                            {formatarData(c.lancamento.agendamento?.inicio ?? c.criadoEm)}
                          </td>
                          <td className="px-3 py-2 text-[#5a4530]">
                            {c.lancamento.agendamento?.cliente?.nome ?? c.lancamento.descricao}
                          </td>
                          <td className="px-3 py-2 text-right text-[#5a4530]">{fmt(c.valorBase)}</td>
                          <td className="px-3 py-2 text-right text-[#9a7d50] text-xs">
                            {c.percentual ? `${c.percentual}%` : "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-[#5a4530]">
                            {fmt(c.valorComissao)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {c.pago ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                <CheckCircle2 size={11} />
                                {c.direcaoComissao === "COLABORADORA_PAGA" ? "Recebido" : "Pago"}
                              </span>
                            ) : (
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                c.direcaoComissao === "COLABORADORA_PAGA"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                              )}>
                                <Clock size={11} />
                                {c.direcaoComissao === "COLABORADORA_PAGA" ? "A receber" : "A pagar"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => setEditando(c)}
                              className="text-[#9a7d50] hover:text-[#B89968] transition-colors"
                              title="Editar comissão"
                            >
                              <Pencil size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
