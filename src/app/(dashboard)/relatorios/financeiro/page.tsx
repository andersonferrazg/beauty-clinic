"use client";

import { useEffect, useState } from "react";
import {
  Loader2, TrendingUp, TrendingDown, Wallet,
  Clock, Download, Printer, X, CalendarDays,
  Banknote, Landmark, CreditCard, Gift, FileText, Link2,
  AlertCircle, BarChart2, ChevronUp, ChevronDown,
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
  projetado?: boolean;
};

type Comissao = {
  id: string;
  valorComissao: number;
  pago: boolean;
  profissional: { id: string; nome: string; cor: string };
};

type DadoMensal = { mes: number; receita: number; despesa: number };
type TopServico  = { nome: string; receita: number; qtd: number };

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
  { key: "Dinheiro",          label: "Dinheiro",  Icon: Banknote },
  { key: "PIX",               label: "PIX",       Icon: Landmark },
  { key: "Cartão de Crédito", label: "Crédito",   Icon: CreditCard },
  { key: "Cartão de Débito",  label: "Débito",    Icon: CreditCard },
  { key: "Link de Pagamento", label: "Link",      Icon: Link2 },
  { key: "Cheque",            label: "Cheque",    Icon: FileText },
  { key: "Cortesia",          label: "Cortesia",  Icon: Gift },
];

const FORMAS_FILTRO = [
  { key: "TODOS",             label: "Todos" },
  { key: "Dinheiro",          label: "Dinheiro" },
  { key: "PIX",               label: "PIX" },
  { key: "Cartão de Crédito", label: "Crédito" },
  { key: "Cartão de Débito",  label: "Débito" },
  { key: "Link de Pagamento", label: "Link" },
  { key: "Cheque",            label: "Cheque" },
  { key: "Cortesia",          label: "Cortesia" },
  { key: "Retorno",           label: "Retorno" },
  { key: "__SEM_FORMA__",     label: "Sem forma" },
];

const CORES_SERVICOS = ["#B89968", "#6366F1", "#EC4899", "#10B981", "#F59E0B"];

// ── Modal "Ver todos os serviços" ─────────────────────────────────────────────
function ModalTodosServicos({
  servicos,
  total,
  onFechar,
}: {
  servicos: TopServico[];
  total: number;
  onFechar: () => void;
}) {
  const [ordem, setOrdem] = useState<"receita" | "qtd">("receita");
  const [dir, setDir] = useState<"desc" | "asc">("desc");

  function alternarOrdem(col: "receita" | "qtd") {
    if (col === ordem) setDir(d => d === "desc" ? "asc" : "desc");
    else { setOrdem(col); setDir("desc"); }
  }

  const ordenados = [...servicos].sort((a, b) => {
    const diff = a[ordem] - b[ordem];
    return dir === "desc" ? -diff : diff;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-[#B89968]" />
            <h2 className="text-base font-semibold text-[#5a4530]">Todos os serviços</h2>
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#faf5ee]">
              <tr className="border-b border-[#e8dcc4]">
                <th className="text-left px-4 py-2.5 text-[#9a7d50] font-medium">#</th>
                <th className="text-left px-2 py-2.5 text-[#9a7d50] font-medium">Serviço</th>
                <th
                  className="text-right px-3 py-2.5 text-[#9a7d50] font-medium cursor-pointer select-none hover:text-[#5a4530]"
                  onClick={() => alternarOrdem("qtd")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Qtd {ordem === "qtd" ? (dir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null}
                  </span>
                </th>
                <th
                  className="text-right px-4 py-2.5 text-[#9a7d50] font-medium cursor-pointer select-none hover:text-[#5a4530]"
                  onClick={() => alternarOrdem("receita")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Receita {ordem === "receita" ? (dir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((s, i) => {
                const pct = total > 0 ? (s.receita / total) * 100 : 0;
                return (
                  <tr key={s.nome} className="border-b border-[#e8dcc4]/50 hover:bg-[#faf5ee]/50">
                    <td className="px-4 py-2.5 text-[#9a7d50] font-medium">{i + 1}</td>
                    <td className="px-2 py-2.5">
                      <p className="text-[#5a4530] font-medium leading-tight">{s.nome}</p>
                      <div className="w-full bg-[#f5f0e8] rounded-full h-1 mt-1">
                        <div
                          className="h-1 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: CORES_SERVICOS[i % CORES_SERVICOS.length] }}
                        />
                      </div>
                    </td>
                    <td className="text-right px-3 py-2.5 text-[#9a7d50]">{s.qtd}x</td>
                    <td className="text-right px-4 py-2.5 font-semibold text-[#5a4530] whitespace-nowrap">{fmt(s.receita)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#faf5ee] border-t-2 border-[#e8dcc4]">
                <td colSpan={2} className="px-4 py-2.5 text-xs font-bold text-[#5a4530]">Total</td>
                <td className="text-right px-3 py-2.5 text-xs font-bold text-[#5a4530]">
                  {ordenados.reduce((s, x) => s + x.qtd, 0)}x
                </td>
                <td className="text-right px-4 py-2.5 text-xs font-bold text-[#5a4530] whitespace-nowrap">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

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
    : filtro === "__SEM_FORMA__"
    ? lancamentos.filter((l) => !l.formaPagamento)
    : lancamentos.filter((l) => l.formaPagamento === filtro);

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
            {FORMAS_FILTRO.filter(f =>
              f.key === "TODOS" ||
              f.key === "__SEM_FORMA__" ? lancamentos.some(l => !l.formaPagamento) :
              true
            ).map(({ key, label }) => (
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

  // Projeção / futuros
  const [incluirFuturos, setIncluirFuturos] = useState(false);
  const [projecao, setProjecao] = useState<Lancamento[]>([]);
  const [projecaoCarregando, setProjecaoCarregando] = useState(false);

  // Top serviços
  const [top5, setTop5] = useState<TopServico[]>([]);
  const [top5Todos, setTop5Todos] = useState<TopServico[]>([]);
  const [top5Total, setTop5Total] = useState(0);
  const [mostrarTodosServicos, setMostrarTodosServicos] = useState(false);

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

  useEffect(() => {
    if (!incluirFuturos) { setProjecao([]); setProjecaoCarregando(false); return; }
    setProjecaoCarregando(true);
    fetch(`/api/relatorios/projecao?mes=${mes}`)
      .then(r => r.json())
      .then(d => setProjecao(Array.isArray(d) ? d : []))
      .finally(() => setProjecaoCarregando(false));
  }, [mes, incluirFuturos]);

  useEffect(() => {
    fetch(`/api/relatorios/top-servicos?mes=${mes}&futuros=${incluirFuturos}`)
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.top5))  setTop5(d.top5);
        if (d && Array.isArray(d.todos)) setTop5Todos(d.todos);
        if (d && typeof d.total === "number") setTop5Total(d.total);
      })
      .catch(() => {});
  }, [mes, incluirFuturos]);

  // ── Cálculos ───────────────────────────────────────────────────────────────
  const receitasFinalizadas = lancamentos.filter(l => l.tipo === "RECEITA");
  const despesas            = lancamentos.filter(l => l.tipo === "DESPESA");

  // projecao só é incluído quando toggle está ativo E o fetch já terminou
  const projecaoAtiva = incluirFuturos && !projecaoCarregando ? projecao : [];
  const todasReceitas: Lancamento[] = [...receitasFinalizadas, ...projecaoAtiva];

  const totalReceitasFinalizadas = receitasFinalizadas.reduce((s, l) => s + l.valor, 0);
  const totalProjetado           = projecaoAtiva.reduce((s, l) => s + l.valor, 0);
  const totalReceitas            = totalReceitasFinalizadas + totalProjetado;
  const totalReceitasPago        = receitasFinalizadas.filter(l => l.pago).reduce((s, l) => s + l.valor, 0);

  const CATEGORIAS_EXCLUIDAS = ["Comissões", "Gastos Casa"];
  const despesasOperacionais  = despesas.filter(l => !CATEGORIAS_EXCLUIDAS.includes(l.categoria ?? ""));
  const totalDespesasOp       = despesasOperacionais.reduce((s, l) => s + l.valor, 0);
  const totalDespesasOpPago   = despesasOperacionais.filter(l => l.pago).reduce((s, l) => s + l.valor, 0);

  const totalComissoes        = comissoes.reduce((s, c) => s + c.valorComissao, 0);
  const totalComissoesPagas   = comissoes.filter(c => c.pago).reduce((s, c) => s + c.valorComissao, 0);
  const totalComissoesPendentes = totalComissoes - totalComissoesPagas;

  const totalDespesasPago = totalDespesasOpPago + totalComissoesPagas;
  const lucro             = totalReceitasPago - totalDespesasPago;
  const lucroAjustado     = totalReceitasPago - totalDespesasOpPago - totalComissoes;

  // Breakdown de formas de pagamento (usa apenas receitas PAGAS — projetos sem pago=true não contam)
  const receitasPagas = todasReceitas.filter(l => l.pago);
  const breakdownFormas = FORMAS_BREAKDOWN.map(({ key, label, Icon }) => {
    const valor = receitasPagas.filter(l => l.formaPagamento === key).reduce((s, l) => s + l.valor, 0);
    const pct   = totalReceitasPago > 0 ? (valor / totalReceitasPago) * 100 : 0;
    return { label, valor, pct, Icon, semForma: false };
  });
  const valorSemForma = receitasPagas.filter(l => !l.formaPagamento).reduce((s, l) => s + l.valor, 0);
  if (valorSemForma > 0) {
    breakdownFormas.push({
      label: "Sem forma",
      valor: valorSemForma,
      pct: totalReceitasPago > 0 ? (valorSemForma / totalReceitasPago) * 100 : 0,
      Icon: FileText,
      semForma: true,
    });
  }

  const receitasPorCat = todasReceitas.reduce<Record<string, number>>((acc, l) => {
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

  // ── Fluxo Diário ──────────────────────────────────────────────────────────
  const lancsPorDia: Record<string, Lancamento[]> = {};
  for (const l of lancamentos.filter(ll => ll.categoria !== "Gastos Casa")) {
    const data = (l.vencimento ?? l.criadoEm).slice(0, 10);
    if (!lancsPorDia[data]) lancsPorDia[data] = [];
    lancsPorDia[data].push(l);
  }
  // Adiciona projeções ao fluxo diário quando toggle está ativo
  if (incluirFuturos) {
    for (const l of projecao) {
      const data = (l.vencimento ?? l.criadoEm).slice(0, 10);
      if (!lancsPorDia[data]) lancsPorDia[data] = [];
      lancsPorDia[data].push(l);
    }
  }

  const [anoMesStr, mesNumStr] = mes.split("-");
  const diasNoMes = new Date(parseInt(anoMesStr), parseInt(mesNumStr), 0).getDate();
  const todosDiasMes = Array.from({ length: diasNoMes }, (_, i) => {
    const dia  = String(i + 1).padStart(2, "0");
    const data = `${mes}-${dia}`;
    const lancs = lancsPorDia[data] ?? [];
    // Conta receitas pagas E projetadas (quando toggle ativo)
    const rec  = lancs.filter(l => l.tipo === "RECEITA" && (l.pago || l.projetado)).reduce((s, l) => s + l.valor, 0);
    const desp = lancs.filter(l => l.tipo === "DESPESA" && l.pago && l.categoria !== "Comissões").reduce((s, l) => s + l.valor, 0);
    return { data, dia, lancs, receita: rec, despesa: desp, resultado: rec - desp };
  });

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

  const mesesComReceita = dadosAnuais ? dadosAnuais.filter(d => d.receita > 0) : [];
  const melhorMes = mesesComReceita.length > 0
    ? mesesComReceita.reduce((mx, d) => d.receita > mx.receita ? d : mx)
    : null;
  const piorMes = mesesComReceita.length > 0
    ? mesesComReceita.reduce((mn, d) => d.receita < mn.receita ? d : mn)
    : null;
  const ganhoMedio = mesesComReceita.length > 0
    ? totalAnual.receita / mesesComReceita.length
    : 0;

  // ──────────────────────────────────────────────────────────────────────────
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
        <div className="flex items-center gap-3 flex-wrap">
          {aba !== "anual" && (
            <>
              <input
                type="month"
                value={mes}
                onChange={(e) => { setMes(e.target.value); setDiaSelecionado(null); }}
                className="border border-[#B89968]/30 rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
              />
              {/* Toggle dados futuros */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button
                  role="switch"
                  aria-checked={incluirFuturos}
                  onClick={() => setIncluirFuturos(v => !v)}
                  className={cn(
                    "relative w-9 h-5 rounded-full transition-colors flex-shrink-0",
                    incluirFuturos ? "bg-[#B89968]" : "bg-[#e8dcc4]"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                    incluirFuturos ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
                <span className="text-xs text-[#9a7d50] whitespace-nowrap">Ver projeção</span>
              </label>
            </>
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

      {/* Aviso de projeção */}
      {incluirFuturos && aba !== "anual" && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4">
          {projecaoCarregando
            ? <Loader2 size={15} className="text-amber-500 flex-shrink-0 animate-spin" />
            : <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
          }
          <p className="text-xs text-amber-700">
            {projecaoCarregando
              ? "Calculando projeção…"
              : <><span className="font-semibold">Esta é apenas uma projeção</span> — inclui atendimentos agendados ainda não finalizados{totalProjetado > 0 ? ` (${fmt(totalProjetado)} projetado)` : ""}.</>
            }
          </p>
        </div>
      )}

      {/* Abas */}
      <div className="flex border-b border-[#e8dcc4] mb-6 gap-1">
        {([
          { key: "resumo", label: "Resumo" },
          { key: "diario", label: "Fluxo Diário" },
          { key: "anual",  label: "Fluxo de Caixa" },
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

      {/* ── Loading ──────────────────────────────────────────────────────────── */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#B89968]" />
        </div>

      ) : aba === "resumo" ? (
        /* ── Aba Resumo ────────────────────────────────────────────────────── */
        <>
          {/* DRE */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm mb-5">
            <h2 className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-4">DRE — Demonstrativo do Resultado</h2>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2 border-b border-[#e8dcc4]">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-green-600" />
                  <span className="text-sm text-[#5a4530]">(+) Receita Bruta</span>
                  {incluirFuturos && totalProjetado > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-medium">
                      +{fmt(totalProjetado)} projetado
                    </span>
                  )}
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

          {/* Formas de pagamento */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm mb-5">
            <h2 className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-4">Receita por forma de pagamento</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {breakdownFormas.map(({ label, valor, pct, Icon, semForma }) => (
                <div key={label} className={cn(
                  "flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center",
                  semForma ? "bg-amber-50" : "bg-[#faf5ee]"
                )}>
                  <Icon size={18} className={semForma ? "text-amber-400" : valor > 0 ? "text-[#B89968]" : "text-[#c8b99a]"} />
                  <p className="text-[10px] text-[#9a7d50] leading-tight">{label}</p>
                  <p className={cn("text-xs font-bold", semForma ? "text-amber-600" : valor > 0 ? "text-[#5a4530]" : "text-[#c8b99a]")}>{fmt(valor)}</p>
                  <p className={cn("text-[10px] font-semibold", semForma ? "text-amber-500" : valor > 0 ? "text-[#B89968]" : "text-[#c8b99a]")}>{pct.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 serviços */}
          {top5.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm mb-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider">Top serviços do mês</h2>
                {top5Todos.length > 5 && (
                  <button
                    onClick={() => setMostrarTodosServicos(true)}
                    className="text-xs text-[#B89968] hover:text-[#9a7d50] font-medium"
                  >
                    Ver todos ({top5Todos.length})
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {top5.map((s, i) => {
                  const pct = top5Total > 0 ? (s.receita / top5Total) * 100 : 0;
                  const cor = CORES_SERVICOS[i % CORES_SERVICOS.length];
                  return (
                    <div key={s.nome}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cor }}
                          />
                          <span className="text-[#5a4530] font-medium truncate">{s.nome}</span>
                          <span className="text-[#9a7d50] flex-shrink-0">{s.qtd}x</span>
                        </div>
                        <span className="font-semibold text-[#5a4530] pl-2 flex-shrink-0">{fmt(s.receita)}</span>
                      </div>
                      <div className="w-full bg-[#f5f0e8] rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: cor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-[#e8dcc4] flex justify-between text-xs text-[#9a7d50]">
                <span>Total por serviços</span>
                <span className="font-semibold text-[#5a4530]">{fmt(top5Total)}</span>
              </div>
            </div>
          )}

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
        /* ── Aba Fluxo Diário ─────────────────────────────────────────────── */
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
        <>
          {/* Indicadores Melhor / Pior / Médio */}
          {dadosAnuais && mesesComReceita.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 shadow-sm text-center">
                <p className="text-[10px] font-semibold text-[#9a7d50] uppercase tracking-wider mb-1">Melhor mês</p>
                {melhorMes && (
                  <>
                    <p className="text-xs font-bold text-[#B89968] mb-0.5">{MESES_ABREV[melhorMes.mes - 1]}</p>
                    <p className="text-sm font-bold text-emerald-600">{fmt(melhorMes.receita)}</p>
                  </>
                )}
              </div>
              <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 shadow-sm text-center">
                <p className="text-[10px] font-semibold text-[#9a7d50] uppercase tracking-wider mb-1">Ganho médio</p>
                <p className="text-sm font-bold text-[#5a4530] mt-5">{fmt(ganhoMedio)}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 shadow-sm text-center">
                <p className="text-[10px] font-semibold text-[#9a7d50] uppercase tracking-wider mb-1">Pior mês</p>
                {piorMes && (
                  <>
                    <p className="text-xs font-bold text-[#B89968] mb-0.5">{MESES_ABREV[piorMes.mes - 1]}</p>
                    <p className="text-sm font-bold text-red-500">{fmt(piorMes.receita)}</p>
                  </>
                )}
              </div>
            </div>
          )}

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
                    <tr className="border-b border-[#e8dcc4]">
                      <td className="px-4 py-3 font-semibold text-[#5a4530]">Receitas</td>
                      {dadosAnuais.map((d) => (
                        <td key={d.mes} className="text-right px-3 py-3 text-emerald-600 whitespace-nowrap">
                          {d.receita > 0 ? fmt(d.receita) : <span className="text-[#c8b99a]">R$ 0,00</span>}
                        </td>
                      ))}
                      <td className="text-right px-4 py-3 font-bold text-emerald-600 whitespace-nowrap">{fmt(totalAnual.receita)}</td>
                    </tr>
                    <tr className="border-b border-[#e8dcc4]">
                      <td className="px-4 py-3 font-semibold text-[#5a4530]">Despesas</td>
                      {dadosAnuais.map((d) => (
                        <td key={d.mes} className="text-right px-3 py-3 text-red-500 whitespace-nowrap">
                          {d.despesa > 0 ? fmt(d.despesa) : <span className="text-[#c8b99a]">R$ 0,00</span>}
                        </td>
                      ))}
                      <td className="text-right px-4 py-3 font-bold text-red-500 whitespace-nowrap">{fmt(totalAnual.despesa)}</td>
                    </tr>
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
        </>
      )}

      {/* Modal detalhe do dia */}
      {diaSelecionado && (
        <ModalDetalheDia
          data={diaSelecionado}
          lancamentos={lancsPorDia[diaSelecionado] ?? []}
          onFechar={() => setDiaSelecionado(null)}
        />
      )}

      {/* Modal todos os serviços */}
      {mostrarTodosServicos && (
        <ModalTodosServicos
          servicos={top5Todos}
          total={top5Total}
          onFechar={() => setMostrarTodosServicos(false)}
        />
      )}
    </div>
  );
}
