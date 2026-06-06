"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Check, ExternalLink, Download, Receipt, FileText } from "lucide-react";
import { getSessaoCliente } from "@/lib/sessao-cliente";
import type { Permissoes } from "@/lib/session";
import { cn } from "@/lib/utils";

type Profissional = { id: string; nome: string };

type AtendimentoNF = {
  id: string;
  data: string | null;
  clienteNome: string;
  clienteCpf: string | null;
  clienteTelefone: string | null;
  profissionalNome: string;
  servicos: string[];
  valor: number;
  formaPagamento: string;
  nfEmitida: boolean;
  nfEmitidaEm: string | null;
};

type Totais = { valor: number; count: number; emitidas: number };
type BreakdownFormas = Record<string, { valor: number; count: number }>;

type Dados = {
  atendimentos: AtendimentoNF[];
  totais: Totais;
  breakdownFormas: BreakdownFormas;
};

type Periodo = "mes_atual" | "mes_passado" | "semana_atual" | "hoje" | "personalizado";

const FORMAS = ["Dinheiro", "PIX", "Crédito", "Débito", "Link", "Cheque", "Cortesia"];

function pad(n: number) { return String(n).padStart(2, "0"); }

function fmtData(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function calcPeriodo(tipo: Periodo, ini: string, fim: string): { inicio: string; fim: string } {
  const hoje = new Date();
  if (tipo === "hoje") {
    const s = fmtData(hoje);
    return { inicio: s, fim: s };
  }
  if (tipo === "semana_atual") {
    const dom = new Date(hoje);
    dom.setDate(hoje.getDate() - hoje.getDay());
    const sab = new Date(dom);
    sab.setDate(dom.getDate() + 6);
    return { inicio: fmtData(dom), fim: fmtData(sab) };
  }
  if (tipo === "mes_atual") {
    return {
      inicio: fmtData(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
      fim: fmtData(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)),
    };
  }
  if (tipo === "mes_passado") {
    const m = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
    const y = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
    return {
      inicio: fmtData(new Date(y, m, 1)),
      fim: fmtData(new Date(y, m + 1, 0)),
    };
  }
  return { inicio: ini, fim: fim };
}

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function formatarData(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatarCpf(cpf: string | null) {
  if (!cpf) return "—";
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11) return cpf;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

export default function NotasFiscaisPage() {
  const router = useRouter();
  const [permissoes, setPermissoes] = useState<Permissoes | null>(null);
  const [guardOk, setGuardOk] = useState(false);

  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [urlNFSe, setUrlNFSe] = useState<string | null>(null);

  const [periodo, setPeriodo] = useState<Periodo>("mes_atual");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [formasSelecionadas, setFormasSelecionadas] = useState<string[]>([]);
  const [apenasNaoEmitidas, setApenasNaoEmitidas] = useState(false);

  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [copiandoId, setCopiandoId] = useState<string | null>(null);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  // Guard de permissão
  useEffect(() => {
    getSessaoCliente()
      .then((s: unknown) => {
        const sessao = s as { permissoes?: Permissoes } | null;
        if (!sessao?.permissoes) { router.replace("/dashboard"); return; }
        if (!sessao.permissoes.isAdmin && !sessao.permissoes.acessarNotasFiscais) {
          router.replace("/dashboard");
          return;
        }
        setPermissoes(sessao.permissoes);
        setGuardOk(true);
      })
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  // Carrega profissionais e config
  useEffect(() => {
    if (!guardOk) return;
    fetch("/api/profissionais").then((r) => r.json()).then((list: Profissional[]) => {
      setProfissionais(list.filter((p) => p));
    });
    fetch("/api/configuracoes").then((r) => r.json()).then((cfg: { urlNFSe?: string }) => {
      setUrlNFSe(cfg.urlNFSe || null);
    });
  }, [guardOk]);

  const { inicio: inicioFinal, fim: fimFinal } = calcPeriodo(periodo, dataInicio, dataFim);

  const buscarDados = useCallback(() => {
    if (!guardOk) return;
    if (periodo === "personalizado" && (!dataInicio || !dataFim)) return;

    setCarregando(true);
    const params = new URLSearchParams({ inicio: inicioFinal, fim: fimFinal });
    if (profissionalId) params.set("profissionalId", profissionalId);
    if (formasSelecionadas.length > 0) params.set("formas", formasSelecionadas.join(","));
    if (apenasNaoEmitidas) params.set("apenasNaoEmitidas", "true");

    fetch(`/api/relatorios/notas-fiscais?${params}`)
      .then((r) => r.json())
      .then((d: Dados) => setDados(d))
      .finally(() => setCarregando(false));
  }, [guardOk, periodo, dataInicio, dataFim, inicioFinal, fimFinal, profissionalId, formasSelecionadas, apenasNaoEmitidas]);

  useEffect(() => { buscarDados(); }, [buscarDados]);

  function toggleForma(f: string) {
    setFormasSelecionadas((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  async function toggleNfEmitida(atendimento: AtendimentoNF) {
    setSalvandoId(atendimento.id);
    const novoValor = !atendimento.nfEmitida;
    try {
      const res = await fetch(`/api/agendamentos/${atendimento.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nfEmitida: novoValor }),
      });
      if (res.ok) {
        setDados((prev) => {
          if (!prev) return prev;
          const atendimentos = prev.atendimentos.map((a) =>
            a.id === atendimento.id
              ? { ...a, nfEmitida: novoValor, nfEmitidaEm: novoValor ? new Date().toISOString() : null }
              : a
          );
          const emitidas = atendimentos.filter((a) => a.nfEmitida).length;
          return { ...prev, atendimentos, totais: { ...prev.totais, emitidas } };
        });
      }
    } finally {
      setSalvandoId(null);
    }
  }

  function copiarLinha(a: AtendimentoNF) {
    const cpf = formatarCpf(a.clienteCpf);
    const servicos = a.servicos.join(", ") || "—";
    const valor = `R$ ${a.valor.toFixed(2).replace(".", ",")}`;
    const data = formatarData(a.data);
    const texto = `${a.clienteNome} | CPF: ${cpf} | ${servicos} | ${valor} | ${data}`;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiandoId(a.id);
      setTimeout(() => setCopiandoId(null), 1500);
    });
  }

  function exportarCSV() {
    if (!dados) return;
    const cabecalho = ["Data", "Cliente", "CPF", "Profissional", "Serviços", "Valor (R$)", "Forma Pagamento", "NF Emitida", "NF Emitida Em"];
    const linhas = dados.atendimentos.map((a) => [
      formatarData(a.data),
      a.clienteNome,
      formatarCpf(a.clienteCpf),
      a.profissionalNome,
      a.servicos.join("; "),
      a.valor.toFixed(2),
      a.formaPagamento,
      a.nfEmitida ? "Sim" : "Não",
      a.nfEmitidaEm ? formatarData(a.nfEmitidaEm) : "",
    ]);
    const csv = "﻿" + [cabecalho, ...linhas].map((l) => l.map((v) => `"${v}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notas-fiscais-${inicioFinal}-${fimFinal}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!guardOk) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#B89968]" size={32} />
      </div>
    );
  }

  const atendimentos = dados?.atendimentos ?? [];
  const totais = dados?.totais;
  const breakdown = dados?.breakdownFormas ?? {};

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#B89968]/10 flex items-center justify-center">
            <Receipt size={18} className="text-[#B89968]" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-semibold text-[#5a4530]">Notas Fiscais</h1>
            <p className="text-sm text-[#9a7d50]">Listagem para emissão manual no sistema da prefeitura</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {urlNFSe && (
            <a
              href={urlNFSe}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e8dcc4] bg-white text-[#5a4530] text-sm hover:bg-[#faf5ee] transition-colors"
            >
              <ExternalLink size={14} />
              Abrir sistema de NF
            </a>
          )}
          <button
            onClick={exportarCSV}
            disabled={!dados || atendimentos.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#B89968] text-white text-sm hover:bg-[#9a7d50] transition-colors disabled:opacity-40"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 mb-4 space-y-4">
        {/* Presets de período */}
        <div className="flex flex-wrap gap-2">
          {(["hoje", "semana_atual", "mes_atual", "mes_passado", "personalizado"] as Periodo[]).map((p) => {
            const labels: Record<Periodo, string> = {
              hoje: "Hoje",
              semana_atual: "Semana atual",
              mes_atual: "Mês atual",
              mes_passado: "Mês passado",
              personalizado: "Personalizado",
            };
            return (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  periodo === p
                    ? "bg-[#B89968] text-white"
                    : "bg-[#faf5ee] text-[#5a4530] hover:bg-[#e8dcc4]"
                )}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* Datas personalizadas */}
        {periodo === "personalizado" && (
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#9a7d50] font-medium">De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="border border-[#e8dcc4] rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#9a7d50] font-medium">Até</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="border border-[#e8dcc4] rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
              />
            </div>
          </div>
        )}

        {/* Profissional + toggle */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#9a7d50] font-medium">Profissional</label>
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              className="border border-[#e8dcc4] rounded-lg px-3 py-1.5 text-sm text-[#5a4530] bg-white focus:outline-none focus:ring-1 focus:ring-[#B89968]"
            >
              <option value="">Todas</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setApenasNaoEmitidas((v) => !v)}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                apenasNaoEmitidas ? "bg-[#B89968]" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                apenasNaoEmitidas ? "translate-x-5" : "translate-x-0.5"
              )} />
            </div>
            <span className="text-sm text-[#5a4530]">Ocultar já emitidas</span>
          </label>
        </div>

        {/* Formas de pagamento multi-select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#9a7d50] font-medium">Forma de pagamento (clique para filtrar)</label>
          <div className="flex flex-wrap gap-2">
            {FORMAS.map((f) => (
              <button
                key={f}
                onClick={() => toggleForma(f)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border transition-colors",
                  formasSelecionadas.includes(f)
                    ? "bg-[#B89968] text-white border-[#B89968]"
                    : "bg-white text-[#5a4530] border-[#e8dcc4] hover:bg-[#faf5ee]"
                )}
              >
                {f}
              </button>
            ))}
            {formasSelecionadas.length > 0 && (
              <button
                onClick={() => setFormasSelecionadas([])}
                className="px-3 py-1 rounded-full text-sm text-[#9a7d50] hover:text-[#5a4530] transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      {totais && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
            <p className="text-xs text-[#9a7d50] font-medium mb-1">Total no período</p>
            <p className="text-lg font-semibold text-[#5a4530]">{fmt(totais.valor)}</p>
            <p className="text-xs text-[#9a7d50]">{totais.count} atendimento{totais.count !== 1 ? "s" : ""}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
            <p className="text-xs text-[#9a7d50] font-medium mb-1">Notas emitidas</p>
            <p className="text-lg font-semibold text-emerald-600">{totais.emitidas}</p>
            <p className="text-xs text-[#9a7d50]">de {totais.count} no total</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
            <p className="text-xs text-[#9a7d50] font-medium mb-1">A emitir</p>
            <p className="text-lg font-semibold text-amber-600">{totais.count - totais.emitidas}</p>
            <p className="text-xs text-[#9a7d50]">pendentes</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
            <p className="text-xs text-[#9a7d50] font-medium mb-1">Por forma</p>
            <div className="space-y-0.5 mt-1">
              {Object.entries(breakdown)
                .sort(([, a], [, b]) => b.valor - a.valor)
                .slice(0, 3)
                .map(([forma, v]) => (
                  <div key={forma} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#9a7d50] truncate">{forma}</span>
                    <span className="text-xs font-medium text-[#5a4530] whitespace-nowrap">{fmt(v.valor)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#B89968]" size={28} />
          </div>
        ) : atendimentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText size={36} className="text-[#e8dcc4]" />
            <p className="text-[#9a7d50] text-sm">Nenhum atendimento encontrado para os filtros selecionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#9a7d50] w-10">NF</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#9a7d50]">Data</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#9a7d50]">Cliente</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#9a7d50]">CPF</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#9a7d50]">Serviço(s)</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-[#9a7d50]">Valor</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#9a7d50]">Forma</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-[#9a7d50] w-14">Copiar</th>
                </tr>
              </thead>
              <tbody>
                {atendimentos.map((a) => (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-b border-[#e8dcc4] last:border-0 transition-colors",
                      a.nfEmitida ? "bg-emerald-50" : "hover:bg-[#faf5ee]"
                    )}
                  >
                    {/* Checkbox NF emitida */}
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => toggleNfEmitida(a)}
                        disabled={salvandoId === a.id}
                        className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                        style={{
                          borderColor: a.nfEmitida ? "#059669" : "#d1d5db",
                          backgroundColor: a.nfEmitida ? "#059669" : "white",
                        }}
                      >
                        {salvandoId === a.id ? (
                          <Loader2 size={11} className="animate-spin text-white" />
                        ) : a.nfEmitida ? (
                          <Check size={11} className="text-white" />
                        ) : null}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-[#5a4530] whitespace-nowrap">
                      {formatarData(a.data)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[#5a4530] font-medium leading-tight">{a.clienteNome}</div>
                      {a.nfEmitida && (
                        <span className="inline-block text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 mt-0.5">
                          Emitida {a.nfEmitidaEm ? formatarData(a.nfEmitidaEm) : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[#9a7d50] whitespace-nowrap font-mono text-xs">
                      {formatarCpf(a.clienteCpf)}
                    </td>
                    <td className="px-3 py-2.5 text-[#5a4530] max-w-[200px]">
                      <span className="line-clamp-2">{a.servicos.join(", ") || "—"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[#5a4530] whitespace-nowrap">
                      {fmt(a.valor)}
                    </td>
                    <td className="px-3 py-2.5 text-[#9a7d50] text-xs">
                      {a.formaPagamento}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => copiarLinha(a)}
                        title="Copiar para colar no sistema de NF"
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          copiandoId === a.id
                            ? "bg-emerald-100 text-emerald-600"
                            : "hover:bg-[#e8dcc4] text-[#9a7d50]"
                        )}
                      >
                        {copiandoId === a.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rodapé com instrução */}
      {atendimentos.length > 0 && (
        <p className="text-xs text-[#9a7d50] mt-3 text-center">
          Marque o checkbox para registrar que a nota foi emitida. Use "Copiar" para colar os dados no sistema da prefeitura.
        </p>
      )}
    </div>
  );
}
