"use client";

import { useEffect, useState } from "react";
import {
  Loader2, TrendingUp, TrendingDown, Wallet,
  Clock, Download, Printer, X, CalendarDays,
  Banknote, Landmark, CreditCard, Gift, FileText, Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Lancamento = {
  id: string;
  tipo: string;
  categoria: string | null;
  descricao: string;
  valor: number;
  pago: boolean;
  formaPagamento: string | null;
  vencimento: string | null;
  criadoEm: string;
};

type Comissao = {
  id: string;
  valorComissao: number;
  pago: boolean;
  profissional: { id: string; nome: string; cor: string };
};

type DadoMensal = { mes: number; receita: number; despesa: number };

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dataExibicao(iso: string) {
  const [, , dia] = iso.split("-");
  const d = new Date(iso + "T12:00");
  const semana = d.toLocaleDateString("pt-BR", { weekday: "short" });
  return { dia, semana: semana.replace(".", "") };
}

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const FORMAS_BREAKDOWN = [
  { key: "Dinheiro",           label: "Dinheiro",     Icon: Banknote },
  { key: "Pix/Transferência",  label: "PIX / Transf.",Icon: Landmark },
  { key: "Cartão de Crédito",  label: "Crédito",      Icon: CreditCard },
  { key: "Cartão de Débito",   label: "Débito",       Icon: CreditCard },
  { key: "Link de Pagamento",  label: "Link",         Icon: Link2 },
  { key: "Cheque",             label: "Cheque",       Icon: FileText },
  { key: "Cortesia",           label: "Cortesia",     Icon: Gift },
];

const FORMAS_FILTRO = [
  { key: "TODOS",              label: "Todos" },
  { key: "Dinheiro",           label: "Dinheiro" },
  { key: "Pix/Transferência",  label: "PIX" },
  { key: "Cartão de Crédito",  label: "Crédito" },
  { key: "Cartão de Débito",   label: "Débito" },
  { key: "Link de Pagamento",  label: "Link" },
  { key: "Cheque",             label: "Cheque" },
  { key: "Cortesia",           label: "Cortesia" },
  { key: "Retorno",            label: "Retorno" },
];

// ── Modal de detalhe do dia ────────────────────────────────────────────────────
function ModalDetalheDia({
  data,
  lancamentos,
  onFechar,
}: {
  data: string;
  lancamentos: Lancamento[];
  onFechar: () => void;
}) {
  const [filtro, setFiltro] = useState("TODOS");

  const { dia, semana } = dataExibicao(data);
  const [ano, mes] = data.split("-");
  const titulo = `${semana}, ${dia}/${mes}/${ano}`;

  const filtrados = filtro === "TODOS"
    ? lancamentos
    : lancamentos.filter((l) => (l.formaPagamento ?? "Dinheiro") === filtro);

  const totalReceita = filtrados.filter(l => l.tipo === "RECEITA" && l.pago).reduce((s, l) => s + l.valor, 0);
  const totalDespesa = filtrados.filter(l => l.tipo === "DESPESA" && l.pago && l.categoria !== "Comissões").reduce((s, l) => s + l.valor, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-[#B89968]" />
            <h2 className="text-base font-semibold text-[#5a4530] capitalize">{titulo}</h2>
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 pt-4 flex-shrink-0">
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-600 mb-1">Receita</p>
            <p className="text-sm font-bold text-emerald-700">{fmt(totalReceita)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xs text-red-500 mb-1">Despesa</p>
            <p className="text-sm font-bold text-red-600">{fmt(totalDespesa)}</p>
          </div>
        </div>

        <div className="px-5 pt-3 pb-2 flex-shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {FORMAS_FILTRO.filter(f => f.key === "TODOS" || lancamentos.some(l => (l.formaPagamento ?? "Dinheiro") === f.key)).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFiltro(key)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap flex-shrink-0 transition-colors",
                  filtro === key ? "bg-[#B89968] text-white border-[#B89968]" : "bg-white text-[#9a7d50] border-[#e8dcc4]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {filtrados.length === 0 ? (
            <p className="text-sm text-[#9a7d50] text-center py-8">Nenhum lançamento.</p>
          ) : (
            <div className="space-y-2">
              {filtrados.map((l) => {
                const isReceita = l.tipo === "RECEITA";
                return (
                  <div key={l.id} className="flex items-start gap-3 py-2.5 border-b border-[#e8dcc4]/60 last:border-0">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5",
                      isReceita ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
                    )}>
                      {isReceita ? "+" : "−"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#5a4530] truncate">{l.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {l.categoria && (
                          <span className="text-[10px] text-[#9a7d50] bg-[#f5f0e8] px-1.5 py-0.5 rounded">{l.categoria}</span>
                        )}
                        {l.formaPagamento && (
                          <span className="text-[10px] text-[#9a7d50]">{l.formaPagamento}</span>
                        )}
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-medium",
                          l.pago ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {l.pago ? "Finalizado" : "Pendente"}
                        </span>
                      </div>
                    </div>
                    <span className={cn("text-sm font-semibold flex-shrink-0", isReceita ? "text-emerald-600" : "text-red-500")}>
                      {isReceita ? "+" : "−"}{fmt(l.valor)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function RelatorioFinanceiroPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mes, setMes] = useState(mesAtual());
  const [aba, setAba] = useState<"resumo" | "diario" | "anual">("resumo");
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  // Dados anuais
  const [anoFc, setAnoFc] = useState(new Date().getFullYear());
  const [dadosAnuais, setDadosAnuais] = useState<DadoMensal[] | null>(null);
  const [fcCarregando, setFcCarregando] = useState(false);

  useEffect(() => {
    setCarregando(true);
    Promise.all([
      fetch(`/api/lancamentos?mes=${mes}`).then((r) => r.json()),
      fetch(`/api/comissoes?mes=${mes}`).then((r) => r.json()),
    ])
      .then(([lancs, coms]) => {
        setLancamentos(Array.isArray(lancs) ? lancs : []);
        setComissoes(Array.isArray(coms) ? coms : []);
      })
      .finally(() => setCarregando(false));
  }, [mes]);

  useEffect(() => {
    setFcCarregando(true);
    setDadosAnuais(null);
    fetch(`/api/relatorios/anual?ano=${anoFc}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setDadosAnuais(d); })
      .finally(() => setFcCarregando(false));
  }, [anoFc]);

  // ── Cálculos do Resumo ─────────────────────────────────────────────────────
  const receitas = lancamentos.filter((l) => l.tipo === "RECEITA");
  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA");

  const totalReceitas = receitas.reduce((s, l) => s + l.valor, 0);
  const totalReceitasPago = receitas.filter((l) => l.pago).reduce((s, l) => s + l.valor, 0);

  const CATEGORIAS_EXCLUIDAS = ["Comissões", "Gastos Casa"];
  const despesasOperacionais = despesas.filter((l) => !CATEGORIAS_EXCLUIDAS.includes(l.categoria ?? ""));
  const totalDespesasOp = despesasOperacionais.reduce((s, l) => s + l.valor, 0);
  const totalDespesasOpPago = despesasOperacionais.filter((l) => l.pago).reduce((s, l) => s + l.valor, 0);

  const totalComissoes = comissoes.reduce((s, c) => s + c.valorComissao, 0);
  const totalComissoesPagas = comissoes.filter((c) => c.pago).reduce((s, c) => s + c.valorComissao, 0);
  const totalComissoesPendentes = totalComissoes - totalComissoesPagas;

  const totalDespesasPago = totalDespesasOpPago + totalComissoesPagas;
  const lucro = totalReceitasPago - totalDespesasPago;
  const lucroAjustado = totalReceitasPago - totalDespesasOpPago - totalComissoes;

  const receitasPagas = receitas.filter((l) => l.pago);
  // Formas de pagamento: sempre mostra todas, mesmo com R$0
  const breakdownFormas = FORMAS_BREAKDOWN.map(({ key, label, Icon }) => {
    const valor = receitasPagas.filter((l) => (l.formaPagamento ?? "Dinheiro") === key).reduce((s, l) => s + l.valor, 0);
    const pct = totalReceitasPago > 0 ? (valor / totalReceitasPago) * 100 : 0;
    return { label, valor, pct, Icon };
  });

  const receitasPorCat = receitas.reduce<Record<string, number>>((acc, l) => {
    const cat = l.categoria || "Outros";
    acc[cat] = (acc[cat] || 0) + l.valor;
    return acc;
  }, {});

  const despesasPorCat = despesasOperacionais.reduce<Record<string, number>>((acc, l) => {
    const cat = l.categoria || "Outros";
    acc[cat] = (acc[cat] || 0) + l.valor;
    return acc;
  }, {});

  const comissoesPorProf = comissoes.reduce<Record<string, { total: number; pago: number; cor: string }>>((acc, c) => {
    const nome = c.profissional.nome;
    if (!acc[nome]) acc[nome] = { total: 0, pago: 0, cor: c.profissional.cor };
    acc[nome].total += c.valorComissao;
    if (c.pago) acc[nome].pago += c.valorComissao;
    return acc;
  }, {});

  // ── Cálculos do Fluxo Diário ───────────────────────────────────────────────
  const lancsPorDia: Record<string, Lancamento[]> = {};
  for (const l of lancamentos.filter(ll => ll.categoria !== "Gastos Casa")) {
    const data = (l.vencimento ?? l.criadoEm).slice(0, 10);
    if (!lancsPorDia[data]) lancsPorDia[data] = [];
    lancsPorDia[data].push(l);
  }

  // Todos os dias do mês (com R$0 nos dias sem lançamento)
  const [anoMesStr, mesNumStr] = mes.split("-");
  const diasNoMes = new Date(parseInt(anoMesStr), parseInt(mesNumStr), 0).getDate();
  const todosDiasMes = Array.from({ length: diasNoMes }, (_, i) => {
    const dia = String(i + 1).padStart(2, "0");
    const data = `${mes}-${dia}`;
    const lancs = lancsPorDia[data] ?? [];
    const rec  = lancs.filter(l => l.tipo === "RECEITA" && l.pago).reduce((s, l) => s + l.valor, 0);
    const desp = lancs.filter(l => l.tipo === "DESPESA" && l.pago && l.categoria !== "Comissões").reduce((s, l) => s + l.valor, 0);
    return { data, dia, lancs, receita: rec, despesa: desp, resultado: rec - desp };
  });

  // 3 colunas: ~10 dias cada
  const colSize = Math.ceil(diasNoMes / 3);
  const colunasDiario = [
    todosDiasMes.slice(0, colSize),
    todosDiasMes.slice(colSize, colSize * 2),
    todosDiasMes.slice(colSize * 2),
  ];
  const totalDiario = todosDiasMes.reduce(
    (acc, d) => ({ receita: acc.receita + d.receita, despesa: acc.despesa + d.despesa, resultado: acc.resultado + d.resultado }),
    { receita: 0, despesa: 0, resultado: 0 },
  );

  // ── Dados anuais ───────────────────────────────────────────────────────────
  const totalAnual = dadosAnuais?.reduce(
    (acc, d) => ({ receita: acc.receita + d.receita, despesa: acc.despesa + d.despesa }),
    { receita: 0, despesa: 0 },
  ) ?? { receita: 0, despesa: 0 };

  // ─────────────────────────────────────────────────────────────────────────────
  const nomeMes = new Date(parseInt(anoMesStr), parseInt(mesNumStr) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function exportarCSV() {
    const linhas: string[][] = [];
    linhas.push(["Relatório Financeiro", nomeMes]);
    linhas.push([]);
    linhas.push(["DRE — Demonstrativo do Resultado"]);
    linhas.push(["Item", "Valor"]);
    linhas.push(["(+) Receita Bruta", totalReceitas.toFixed(2)]);
    linhas.push(["    Recebido", totalReceitasPago.toFixed(2)]);
    linhas.push(["(-) Despesas Operacionais", totalDespesasOp.toFixed(2)]);
    linhas.push(["    Pagas", totalDespesasOpPago.toFixed(2)]);
    linhas.push(["(-) Comissões geradas", totalComissoes.toFixed(2)]);
    linhas.push(["    Pagas", totalComissoesPagas.toFixed(2)]);
    linhas.push(["    A pagar", totalComissoesPendentes.toFixed(2)]);
    linhas.push(["Lucro Líquido (caixa)", lucro.toFixed(2)]);
    linhas.push([]);
    linhas.push(["Fluxo de Caixa Diário"]);
    linhas.push(["Data", "Receita", "Despesa", "Resultado"]);
    todosDiasMes.forEach(({ data, receita, despesa, resultado }) => {
      linhas.push([data, receita.toFixed(2), despesa.toFixed(2), resultado.toFixed(2)]);
    });
    linhas.push(["Total", totalDiario.receita.toFixed(2), totalDiario.despesa.toFixed(2), totalDiario.resultado.toFixed(2)]);

    const csv = "﻿" + linhas.map(l => l.map(c => `"${c}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-financeiro-${mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Resumo Financeiro</h1>
          <p className="text-sm text-[#9a7d50] mt-1 capitalize">{nomeMes}</p>
        </div>
        <div className="flex items-center gap-2">
          {aba !== "anual" && (
            <input
              type="month"
              value={mes}
              onChange={(e) => { setMes(e.target.value); setDiaSelecionado(null); }}
              className="border border-[#B89968]/30 rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
            />
          )}
          {aba === "anual" && (
            <div className="flex items-center gap-1 border border-[#B89968]/30 rounded-lg px-3 py-1.5">
              <button onClick={() => setAnoFc(a => a - 1)} className="text-[#9a7d50] hover:text-[#5a4530] px-1 text-lg leading-none">‹</button>
              <span className="text-sm font-medium text-[#5a4530] w-12 text-center">{anoFc}</span>
              <button onClick={() => setAnoFc(a => a + 1)} className="text-[#9a7d50] hover:text-[#5a4530] px-1 text-lg leading-none">›</button>
            </div>
          )}
          {!carregando && aba !== "anual" && (
            <>
              <button
                onClick={exportarCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] hover:bg-[#faf5ee] transition-colors"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={() => window.print()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] hover:bg-[#faf5ee] transition-colors"
              >
                <Printer size={14} /> Imprimir
              </button>
            </>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-[#e8dcc4] mb-6 gap-1">
        {([
          { key: "resumo",  label: "Resumo" },
          { key: "diario",  label: "Fluxo Diário" },
          { key: "anual",   label: "Fluxo de Caixa" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              aba === key ? "border-[#B89968] text-[#B89968]" : "border-transparent text-[#9a7d50] hover:text-[#5a4530]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Aba Resumo ────────────────────────────────────────────────────────── */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#B89968]" />
        </div>
      ) : aba === "resumo" ? (
        <>
          {/* DRE */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm mb-5">
            <h2 className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-4">DRE — Demonstrativo do Resultado</h2>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2 border-b border-[#e8dcc4]">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-green-600" />
                  <span className="text-sm text-[#5a4530]">(+) Receita Bruta</span>
                </div>
                <span className="text-sm font-semibold text-green-600">{fmt(totalReceitas)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#e8dcc4]">
                <span className="text-xs text-[#9a7d50] pl-4">Recebido</span>
                <span className="text-xs text-[#9a7d50]">{fmt(totalReceitasPago)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#e8dcc4]">
                <div className="flex items-center gap-2">
                  <TrendingDown size={14} className="text-red-500" />
                  <span className="text-sm text-[#5a4530]">(−) Despesas Operacionais</span>
                </div>
                <span className="text-sm font-semibold text-red-500">−{fmt(totalDespesasOp)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#e8dcc4]">
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-amber-500" />
                  <span className="text-sm text-[#5a4530]">(−) Comissões geradas</span>
                </div>
                <span className="text-sm font-semibold text-amber-600">−{fmt(totalComissoes)}</span>
              </div>
              {totalComissoesPendentes > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-[#e8dcc4] text-xs">
                  <span className="pl-4 text-[#9a7d50] flex items-center gap-1">
                    <Clock size={11} /> A pagar
                  </span>
                  <span className="text-amber-600">{fmt(totalComissoesPendentes)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-3 mt-2 bg-[#faf5ee] -mx-5 px-5 border-y border-[#B89968]/30">
                <span className="text-sm font-semibold text-[#5a4530]">Lucro Líquido (caixa)</span>
                <span className={`text-lg font-bold ${lucro >= 0 ? "text-[#B89968]" : "text-red-500"}`}>{fmt(lucro)}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-xs text-[#9a7d50]">
                <span>Lucro ajustado (após pagar todas as comissões)</span>
                <span className={lucroAjustado >= 0 ? "text-[#9a7d50]" : "text-red-400"}>{fmt(lucroAjustado)}</span>
              </div>
            </div>
          </div>

          {/* Formas de pagamento — sempre mostra todas */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm mb-5">
            <h2 className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-4">Receita por forma de pagamento</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {breakdownFormas.map(({ label, valor, pct, Icon }) => (
                <div key={label} className="flex flex-col items-center gap-1 py-3 px-2 bg-[#faf5ee] rounded-xl text-center">
                  <Icon size={18} className={valor > 0 ? "text-[#B89968]" : "text-[#c8b99a]"} />
                  <p className="text-[10px] text-[#9a7d50] leading-tight">{label}</p>
                  <p className={cn("text-xs font-bold", valor > 0 ? "text-[#5a4530]" : "text-[#c8b99a]")}>{fmt(valor)}</p>
                  <p className={cn("text-[10px] font-semibold", valor > 0 ? "text-[#B89968]" : "text-[#c8b99a]")}>{pct.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Categorias + Comissões */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#5a4530] mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-green-600" /> Receitas por categoria
              </h3>
              {Object.entries(receitasPorCat).length === 0 ? (
                <p className="text-sm text-[#9a7d50]">Nenhuma receita registrada.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(receitasPorCat).sort(([, a], [, b]) => b - a).map(([cat, valor]) => {
                    const pct = totalReceitas > 0 ? (valor / totalReceitas) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#5a4530]">{cat}</span>
                          <span className="font-medium text-green-600">{fmt(valor)}</span>
                        </div>
                        <div className="w-full bg-[#f5f0e8] rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#5a4530] mb-3 flex items-center gap-2">
                <TrendingDown size={14} className="text-red-500" /> Despesas por categoria
              </h3>
              {Object.entries(despesasPorCat).length === 0 ? (
                <p className="text-sm text-[#9a7d50]">Nenhuma despesa registrada.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(despesasPorCat).sort(([, a], [, b]) => b - a).map(([cat, valor]) => {
                    const pct = totalDespesasOp > 0 ? (valor / totalDespesasOp) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#5a4530]">{cat}</span>
                          <span className="font-medium text-red-500">{fmt(valor)}</span>
                        </div>
                        <div className="w-full bg-[#f5f0e8] rounded-full h-1.5">
                          <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#5a4530] mb-3 flex items-center gap-2">
                <Wallet size={14} className="text-amber-500" /> Comissões por profissional
              </h3>
              {Object.entries(comissoesPorProf).length === 0 ? (
                <p className="text-sm text-[#9a7d50]">Nenhuma comissão no mês.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(comissoesPorProf).sort(([, a], [, b]) => b.total - a.total).map(([nome, info]) => {
                    const pctPago = info.total > 0 ? (info.pago / info.total) * 100 : 0;
                    return (
                      <div key={nome}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.cor }} />
                            <span className="text-[#5a4530] font-medium">{nome}</span>
                          </div>
                          <span className="font-semibold text-amber-600">{fmt(info.total)}</span>
                        </div>
                        <div className="w-full bg-[#f5f0e8] rounded-full h-1.5 mb-0.5">
                          <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${pctPago}%` }} />
                        </div>
                        <p className="text-[10px] text-[#9a7d50]">
                          {fmt(info.pago)} pagos · {fmt(info.total - info.pago)} a pagar
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>

      ) : aba === "diario" ? (
        /* ── Aba Fluxo Diário: todos os dias em 3 colunas ──────────────────── */
        <div className="bg-white rounded-xl border border-[#e8dcc4] shadow-sm overflow-hidden">
          <p className="text-xs text-[#9a7d50] px-4 py-3 border-b border-[#e8dcc4] bg-[#faf5ee]">
            Clique no dia para ver os lançamentos detalhados.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                  {[0, 1, 2].map((col) => (
                    [
                      col > 0 ? <th key={`sep-h-${col}`} className="w-px bg-[#e8dcc4] p-0" /> : null,
                      <th key={`dia-h-${col}`}  className="text-center py-2.5 px-2 text-[#9a7d50] font-medium w-8">Dia</th>,
                      <th key={`rec-h-${col}`}  className="text-right  py-2.5 px-2 text-[#9a7d50] font-medium">Receita</th>,
                      <th key={`des-h-${col}`}  className="text-right  py-2.5 px-2 text-[#9a7d50] font-medium">Despesa</th>,
                      <th key={`res-h-${col}`}  className="text-right  py-2.5 px-2 text-[#9a7d50] font-medium">Resultado</th>,
                    ]
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: colSize }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-[#e8dcc4]/50 hover:bg-[#faf5ee]/50">
                    {colunasDiario.flatMap((col, colIdx) => {
                      const day = col[rowIdx];
                      const sep = colIdx > 0
                        ? [<td key={`sep-${colIdx}-${rowIdx}`} className="w-px bg-[#e8dcc4] p-0" />]
                        : [];
                      if (!day) return [...sep, <td key={`empty-${colIdx}`} colSpan={4} />];
                      const pos = day.resultado > 0;
                      const neg = day.resultado < 0;
                      return [
                        ...sep,
                        <td
                          key={`dia-${colIdx}-${rowIdx}`}
                          onClick={() => setDiaSelecionado(day.data)}
                          className="text-center py-2.5 px-2 font-bold text-[#5a4530] cursor-pointer hover:text-[#B89968] w-8"
                        >
                          {day.dia}
                        </td>,
                        <td key={`rec-${colIdx}-${rowIdx}`} className="text-right py-2.5 px-2 text-emerald-600 whitespace-nowrap">
                          {day.receita > 0 ? fmt(day.receita) : <span className="text-[#c8b99a]">R$ 0,00</span>}
                        </td>,
                        <td key={`des-${colIdx}-${rowIdx}`} className="text-right py-2.5 px-2 text-red-500 whitespace-nowrap">
                          {day.despesa > 0 ? fmt(day.despesa) : <span className="text-[#c8b99a]">R$ 0,00</span>}
                        </td>,
                        <td key={`res-${colIdx}-${rowIdx}`} className="text-right py-2 px-2 whitespace-nowrap">
                          <span className={cn(
                            "font-bold px-2 py-1 rounded text-xs",
                            pos ? "bg-emerald-500 text-white" :
                            neg ? "bg-red-100 text-red-600" :
                            "text-[#c8b99a]"
                          )}>
                            {fmt(day.resultado)}
                          </span>
                        </td>,
                      ];
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#faf5ee] border-t-2 border-[#e8dcc4]">
                  <td className="px-3 py-3 text-xs font-bold text-[#5a4530]" colSpan={4}>Total</td>
                  <td className="text-right px-2 py-3 text-xs font-bold text-emerald-600 whitespace-nowrap">{fmt(totalDiario.receita)}</td>
                  <td className="text-right px-2 py-3 text-xs font-bold text-red-500 whitespace-nowrap">{fmt(totalDiario.despesa)}</td>
                  <td className="text-right px-2 py-3">
                    <span className={cn(
                      "font-bold px-2 py-1 rounded text-xs",
                      totalDiario.resultado >= 0 ? "bg-emerald-500 text-white" : "bg-red-100 text-red-600"
                    )}>
                      {fmt(totalDiario.resultado)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      ) : (
        /* ── Aba Fluxo de Caixa (anual) ──────────────────────────────────── */
        <div className="bg-white rounded-xl border border-[#e8dcc4] shadow-sm overflow-hidden">
          {fcCarregando || !dadosAnuais ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-[#B89968]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                    <th className="text-left px-4 py-3 text-[#9a7d50] font-medium min-w-[100px]"></th>
                    {MESES_ABREV.map((m) => (
                      <th key={m} className="text-right px-3 py-3 text-[#9a7d50] font-medium whitespace-nowrap">{m}</th>
                    ))}
                    <th className="text-right px-4 py-3 text-[#5a4530] font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Receitas */}
                  <tr className="border-b border-[#e8dcc4]">
                    <td className="px-4 py-3 font-semibold text-[#5a4530]">Receitas</td>
                    {dadosAnuais.map((d) => (
                      <td key={d.mes} className="text-right px-3 py-3 text-emerald-600 whitespace-nowrap">
                        {d.receita > 0 ? fmt(d.receita) : <span className="text-[#c8b99a]">R$ 0,00</span>}
                      </td>
                    ))}
                    <td className="text-right px-4 py-3 font-bold text-emerald-600 whitespace-nowrap">{fmt(totalAnual.receita)}</td>
                  </tr>
                  {/* Despesas */}
                  <tr className="border-b border-[#e8dcc4]">
                    <td className="px-4 py-3 font-semibold text-[#5a4530]">Despesas</td>
                    {dadosAnuais.map((d) => (
                      <td key={d.mes} className="text-right px-3 py-3 text-red-500 whitespace-nowrap">
                        {d.despesa > 0 ? fmt(d.despesa) : <span className="text-[#c8b99a]">R$ 0,00</span>}
                      </td>
                    ))}
                    <td className="text-right px-4 py-3 font-bold text-red-500 whitespace-nowrap">{fmt(totalAnual.despesa)}</td>
                  </tr>
                  {/* Lucro/Prejuízo */}
                  <tr className="border-b border-[#e8dcc4]">
                    <td className="px-4 py-3 font-semibold text-[#5a4530]">Lucro / Prejuízo</td>
                    {dadosAnuais.map((d) => {
                      const lucroMes = d.receita - d.despesa;
                      return (
                        <td key={d.mes} className="text-right px-2 py-2 whitespace-nowrap">
                          {d.receita === 0 && d.despesa === 0 ? (
                            <span className="text-[#c8b99a] text-xs px-2 py-1">R$ 0,00</span>
                          ) : (
                            <span className={cn(
                              "font-bold text-xs px-2 py-1 rounded",
                              lucroMes >= 0 ? "bg-emerald-500 text-white" : "bg-red-100 text-red-600"
                            )}>
                              {fmt(lucroMes)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-right px-2 py-2">
                      <span className={cn(
                        "font-bold text-xs px-2 py-1 rounded",
                        (totalAnual.receita - totalAnual.despesa) >= 0 ? "bg-emerald-500 text-white" : "bg-red-100 text-red-600"
                      )}>
                        {fmt(totalAnual.receita - totalAnual.despesa)}
                      </span>
                    </td>
                  </tr>
                  {/* Lucratividade */}
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#5a4530]">Lucratividade</td>
                    {dadosAnuais.map((d) => {
                      const pct = d.receita > 0 ? ((d.receita - d.despesa) / d.receita) * 100 : 0;
                      return (
                        <td key={d.mes} className={cn(
                          "text-right px-3 py-3 font-semibold whitespace-nowrap",
                          d.receita === 0 ? "text-[#c8b99a]" : pct >= 0 ? "text-emerald-600" : "text-red-500"
                        )}>
                          {d.receita === 0 ? "0,0%" : `${pct.toFixed(1)}%`}
                        </td>
                      );
                    })}
                    <td className={cn(
                      "text-right px-4 py-3 font-bold",
                      totalAnual.receita === 0 ? "text-[#c8b99a]" :
                      ((totalAnual.receita - totalAnual.despesa) / totalAnual.receita) >= 0 ? "text-emerald-600" : "text-red-500"
                    )}>
                      {totalAnual.receita > 0
                        ? `${(((totalAnual.receita - totalAnual.despesa) / totalAnual.receita) * 100).toFixed(1)}%`
                        : "0,0%"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal detalhe do dia */}
      {diaSelecionado && (
        <ModalDetalheDia
          data={diaSelecionado}
          lancamentos={lancsPorDia[diaSelecionado] ?? []}
          onFechar={() => setDiaSelecionado(null)}
        />
      )}
    </div>
  );
}
