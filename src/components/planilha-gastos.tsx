"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, X, Check, Download, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type Lancamento = {
  id: string;
  descricao: string;
  valor: number;
  pago: boolean;
  pagoEm: string | null;
  vencimento: string | null;
  categoria: string | null;
};

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ModalConta({
  aberto,
  onFechar,
  onSalvo,
  categoria,
  mes,
  lancamento,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  categoria: string;
  mes: string;
  lancamento?: Lancamento;
}) {
  const ehEdicao = !!lancamento;
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [pagoEm, setPagoEm] = useState("");
  const [pago, setPago] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    if (lancamento) {
      setDescricao(lancamento.descricao);
      setValor(lancamento.valor > 0 ? lancamento.valor.toString() : "");
      setVencimento(lancamento.vencimento ? lancamento.vencimento.slice(0, 10) : "");
      setPagoEm(lancamento.pagoEm ? new Date(lancamento.pagoEm).toISOString().slice(0, 10) : "");
      setPago(lancamento.pago);
    } else {
      setDescricao("");
      setValor("");
      const [ano, m] = mes.split("-");
      setVencimento(`${ano}-${m}-05`);
      setPagoEm("");
      setPago(false);
    }
    setErro("");
  }, [aberto, lancamento, mes]);

  if (!aberto) return null;

  async function salvar() {
    if (!descricao.trim()) { setErro("Descrição obrigatória."); return; }
    const valorNum = parseFloat(valor.replace(",", "."));
    if (!valor.trim() || isNaN(valorNum) || valorNum <= 0) { setErro("Valor obrigatório e deve ser maior que zero."); return; }
    setSalvando(true);
    setErro("");
    const body = {
      tipo: "DESPESA",
      categoria,
      descricao: descricao.trim(),
      valor: valorNum,
      vencimento: vencimento || null,
      pago,
      pagoEm: pagoEm ? new Date(pagoEm + "T12:00:00").toISOString() : (pago ? new Date().toISOString() : null),
    };
    const url = ehEdicao ? `/api/lancamentos/${lancamento!.id}` : "/api/lancamentos";
    const method = ehEdicao ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSalvando(false);
    if (!r.ok) { setErro("Erro ao salvar."); return; }
    onSalvo();
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4]">
          <h2 className="text-base font-serif font-semibold text-[#5a4530]">{ehEdicao ? "Editar Conta" : "Nova Conta"}</h2>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-[#9a7d50] block mb-1">Descrição *</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: ALUGUEL, ENERGIA..."
              className="w-full border border-[#B89968]/30 rounded-lg px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9a7d50] block mb-1">Valor (R$)</label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full border border-[#B89968]/30 rounded-lg px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
              />
            </div>
            <div>
              <label className="text-xs text-[#9a7d50] block mb-1">Vencimento</label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="w-full border border-[#B89968]/30 rounded-lg px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9a7d50] block mb-1">Data do Pagamento</label>
              <input
                type="date"
                value={pagoEm}
                onChange={(e) => { setPagoEm(e.target.value); if (e.target.value) setPago(true); }}
                className="w-full border border-[#B89968]/30 rounded-lg px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pago} onChange={(e) => setPago(e.target.checked)} className="accent-[#B89968]" />
                <span className="text-sm text-[#5a4530]">Pago</span>
              </label>
            </div>
          </div>
          {erro && <p className="text-xs text-red-500">{erro}</p>}
        </div>
        <div className="px-5 py-3 border-t border-[#e8dcc4] flex justify-end gap-2">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-[#9a7d50] hover:text-[#5a4530]">Cancelar</button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="px-4 py-2 rounded-lg bg-[#B89968] hover:bg-[#9a7d50] text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            {salvando && <Loader2 size={13} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlanilhaGastos({
  titulo,
  categoria,
  corHeader = "#5a4530",
}: {
  titulo: string;
  categoria: string;
  corHeader?: string;
}) {
  const [mes, setMes] = useState(mesAtual());
  const [itens, setItens] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [lancamentoEditando, setLancamentoEditando] = useState<Lancamento | undefined>();
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [copiando, setCopiando] = useState(false);
  const [copiadoMsg, setCopiadoMsg] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    const r = await fetch(`/api/lancamentos?mes=${mes}`);
    const todos = await r.json();
    setItens(
      (Array.isArray(todos) ? todos : []).filter(
        (l: Lancamento) => l.categoria === categoria
      )
    );
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [mes]);

  async function togglePago(id: string, pago: boolean) {
    const item = itens.find((l) => l.id === id);
    if (!item) return;
    await fetch(`/api/lancamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, pago, pagoEm: pago ? new Date().toISOString() : null }),
    });
    carregar();
  }

  async function excluir(id: string) {
    await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
    setExcluindoId(null);
    carregar();
  }

  const ordenados = [...itens].sort((a, b) => {
    const da = a.vencimento ? new Date(a.vencimento).getTime() : 0;
    const db = b.vencimento ? new Date(b.vencimento).getTime() : 0;
    return da - db;
  });

  const total = itens.reduce((s, l) => s + l.valor, 0);
  const totalPago = itens.filter((l) => l.pago).reduce((s, l) => s + l.valor, 0);
  const pendente = total - totalPago;

  const [anoMes, mesNum] = mes.split("-");
  const nomeMes = new Date(parseInt(anoMes), parseInt(mesNum) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const proxMesNum = parseInt(mesNum) === 12 ? 1 : parseInt(mesNum) + 1;
  const proxAnoNum = parseInt(mesNum) === 12 ? parseInt(anoMes) + 1 : parseInt(anoMes);
  const nomeProxMes = new Date(proxAnoNum, proxMesNum - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long" });

  async function copiarMes() {
    setCopiando(true);
    setCopiadoMsg(null);
    try {
      const r = await fetch("/api/lancamentos/copiar-mes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, categoria }),
      });
      const d = await r.json();
      const msg = d.criados === 0
        ? `Todos os itens já existem em ${nomeProxMes}.`
        : `${d.criados} item(s) copiado(s) para ${nomeProxMes}${d.ignorados > 0 ? ` (${d.ignorados} já existiam)` : ""}.`;
      setCopiadoMsg(msg);
      setTimeout(() => setCopiadoMsg(null), 5000);
    } finally {
      setCopiando(false);
    }
  }

  function exportarCSV() {
    const linhas = [["Descrição", "Valor (R$)", "Vencimento", "Data Pagamento", "Status"]];
    for (const l of ordenados) {
      linhas.push([
        l.descricao,
        l.valor.toFixed(2),
        l.vencimento
          ? new Date(l.vencimento.length === 10 ? l.vencimento + "T12:00:00" : l.vencimento).toLocaleDateString("pt-BR")
          : "",
        l.pagoEm ? new Date(l.pagoEm).toLocaleDateString("pt-BR") : "",
        l.pago ? "Pago" : "Pendente",
      ]);
    }
    linhas.push(["TOTAL", total.toFixed(2), "", "", ""]);
    const csv = "﻿" + linhas.map((l) => l.map((v) => `"${v}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titulo.toLowerCase().replace(/\s+/g, "-")}-${mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">{titulo}</h1>
          <p className="text-sm text-[#9a7d50] mt-1 capitalize">{nomeMes}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border border-[#B89968]/30 rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
          />
          {!carregando && ordenados.length > 0 && (
            <>
              <button
                onClick={exportarCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] hover:bg-[#faf5ee] transition-colors"
              >
                <Download size={14} /> Exportar
              </button>
              <button
                onClick={copiarMes}
                disabled={copiando}
                title={`Copiar todos os itens para ${nomeProxMes}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] hover:bg-[#faf5ee] transition-colors disabled:opacity-50"
              >
                {copiando ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                Copiar para {nomeProxMes}
              </button>
            </>
          )}
          <button
            onClick={() => { setLancamentoEditando(undefined); setModalAberto(true); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#B89968] hover:bg-[#9a7d50] text-white text-sm font-medium"
          >
            <Plus size={15} /> Nova Conta
          </button>
        </div>
      </div>

      {/* Toast de feedback do copiar mês */}
      {copiadoMsg && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-2.5">
          <Check size={14} className="flex-shrink-0" />
          {copiadoMsg}
        </div>
      )}

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 text-center shadow-sm">
          <p className="text-xs text-[#9a7d50] uppercase tracking-wider mb-1">Total previsto</p>
          <p className="text-lg font-semibold text-[#5a4530]">{fmt(total)}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center shadow-sm">
          <p className="text-xs text-green-700 uppercase tracking-wider mb-1">Pago</p>
          <p className="text-lg font-semibold text-green-700">{fmt(totalPago)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center shadow-sm">
          <p className="text-xs text-amber-700 uppercase tracking-wider mb-1">A pagar</p>
          <p className="text-lg font-semibold text-amber-700">{fmt(pendente)}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
        <div className="px-4 py-3 text-center" style={{ backgroundColor: corHeader }}>
          <h3 className="text-white font-bold uppercase tracking-widest text-sm">{titulo}</h3>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#B89968]" />
          </div>
        ) : ordenados.length === 0 ? (
          <p className="text-center text-sm text-[#9a7d50] py-12">
            Nenhum gasto registrado neste mês.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Produto</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Gasto</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Vencimento</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Data PG</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Pago</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {ordenados.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => { setLancamentoEditando(l); setModalAberto(true); }}
                  className="border-b border-[#e8dcc4] hover:bg-[#faf5ee] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#5a4530]">{l.descricao}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#5a4530]">
                    {l.valor > 0 ? fmt(l.valor) : (
                      <span className="text-[#9a7d50] font-normal text-xs italic">a preencher</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-[#9a7d50] text-xs">
                    {l.vencimento
                      ? new Date(l.vencimento.length === 10 ? l.vencimento + "T12:00:00" : l.vencimento).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-[#9a7d50] text-xs">
                    {l.pagoEm ? new Date(l.pagoEm).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => togglePago(l.id, !l.pago)}
                      className={cn(
                        "px-3 py-1 rounded text-xs font-bold transition-colors",
                        l.pago
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      )}
                    >
                      {l.pago ? (
                        <span className="flex items-center gap-1"><Check size={11} /> PAGO</span>
                      ) : "—"}
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {excluindoId === l.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => excluir(l.id)}
                          className="text-xs text-red-600 font-semibold hover:underline"
                        >Sim</button>
                        <span className="text-[#9a7d50]">/</span>
                        <button
                          onClick={() => setExcluindoId(null)}
                          className="text-xs text-[#9a7d50] hover:underline"
                        >Não</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setExcluindoId(l.id)}
                        className="text-[#9a7d50] hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#faf5ee] border-t-2 border-[#5a4530]">
                <td className="px-4 py-3 font-bold text-[#5a4530] uppercase text-xs tracking-wide">Total</td>
                <td className="px-4 py-3 text-right font-bold text-[#B89968] text-base">{fmt(total)}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <ModalConta
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setLancamentoEditando(undefined); }}
        onSalvo={carregar}
        categoria={categoria}
        mes={mes}
        lancamento={lancamentoEditando}
      />
    </div>
  );
}
