"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, Clock, Download, Printer } from "lucide-react";

type Lancamento = {
  id: string;
  tipo: string;
  categoria: string | null;
  descricao: string;
  valor: number;
  pago: boolean;
  formaPagamento: string | null;
};

type Comissao = {
  id: string;
  valorComissao: number;
  pago: boolean;
  profissional: { id: string; nome: string; cor: string };
};

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function RelatorioFinanceiroPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mes, setMes] = useState(mesAtual());

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

  const receitas = lancamentos.filter((l) => l.tipo === "RECEITA");
  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA");

  const totalReceitas = receitas.reduce((s, l) => s + l.valor, 0);
  const totalReceitasPago = receitas.filter((l) => l.pago).reduce((s, l) => s + l.valor, 0);

  // Despesas da clínica: excluir comissões (contadas à parte) e gastos pessoais (isolados)
  const CATEGORIAS_EXCLUIDAS = ["Comissões", "Gastos Casa"];
  const despesasOperacionais = despesas.filter((l) => !CATEGORIAS_EXCLUIDAS.includes(l.categoria ?? ""));
  const totalDespesasOp = despesasOperacionais.reduce((s, l) => s + l.valor, 0);
  const totalDespesasOpPago = despesasOperacionais.filter((l) => l.pago).reduce((s, l) => s + l.valor, 0);

  // Comissões: somar TODAS as comissões geradas no mês (pagas e a pagar)
  const totalComissoes = comissoes.reduce((s, c) => s + c.valorComissao, 0);
  const totalComissoesPagas = comissoes.filter((c) => c.pago).reduce((s, c) => s + c.valorComissao, 0);
  const totalComissoesPendentes = totalComissoes - totalComissoesPagas;

  const totalDespesas = totalDespesasOp + totalComissoesPagas; // só conta as pagas no lucro caixa
  const totalDespesasPago = totalDespesasOpPago + totalComissoesPagas;
  const lucro = totalReceitasPago - totalDespesasPago;
  const lucroAjustado = totalReceitasPago - totalDespesasOpPago - totalComissoes; // se pagasse tudo

  // Agrupar por categoria
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

  // Breakdown por forma de pagamento (só receitas pagas)
  const FORMAS_PAGAMENTO = [
    { key: "Dinheiro",             label: "Dinheiro" },
    { key: "Pix/Transferência",    label: "PIX / Transf." },
    { key: "Cartão de Crédito",    label: "Crédito" },
    { key: "Cartão de Débito",     label: "Débito" },
    { key: "Link de Pagamento",    label: "Link Pgto." },
    { key: "Cheque",               label: "Cheque" },
    { key: "Cortesia",             label: "Cortesia" },
  ];
  const receitasPagas = receitas.filter((l) => l.pago);
  const totalFormas = receitasPagas.reduce((s, l) => s + l.valor, 0) || 1;
  const breakdownFormas = FORMAS_PAGAMENTO.map(({ key, label }) => {
    const valor = receitasPagas.filter((l) => (l.formaPagamento ?? "Dinheiro") === key).reduce((s, l) => s + l.valor, 0);
    return { label, valor, pct: (valor / totalFormas) * 100 };
  }).filter((f) => f.valor > 0);

  // Comissões por profissional
  const comissoesPorProf = comissoes.reduce<Record<string, { total: number; pago: number; cor: string }>>((acc, c) => {
    const nome = c.profissional.nome;
    if (!acc[nome]) acc[nome] = { total: 0, pago: 0, cor: c.profissional.cor };
    acc[nome].total += c.valorComissao;
    if (c.pago) acc[nome].pago += c.valorComissao;
    return acc;
  }, {});

  const [anoMes, mesNum] = mes.split("-");
  const nomeMes = new Date(parseInt(anoMes), parseInt(mesNum) - 1, 1)
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
    linhas.push(["Lucro ajustado (após pagar todas as comissões)", lucroAjustado.toFixed(2)]);
    linhas.push([]);
    linhas.push(["Receitas por categoria"]);
    linhas.push(["Categoria", "Valor"]);
    Object.entries(receitasPorCat).sort(([, a], [, b]) => b - a).forEach(([cat, val]) => {
      linhas.push([cat, val.toFixed(2)]);
    });
    linhas.push([]);
    linhas.push(["Despesas operacionais por categoria"]);
    linhas.push(["Categoria", "Valor"]);
    Object.entries(despesasPorCat).sort(([, a], [, b]) => b - a).forEach(([cat, val]) => {
      linhas.push([cat, val.toFixed(2)]);
    });
    linhas.push([]);
    linhas.push(["Comissões por profissional"]);
    linhas.push(["Profissional", "Total", "Pago", "A pagar"]);
    Object.entries(comissoesPorProf).sort(([, a], [, b]) => b.total - a.total).forEach(([nome, info]) => {
      linhas.push([nome, info.total.toFixed(2), info.pago.toFixed(2), (info.total - info.pago).toFixed(2)]);
    });

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Resumo Financeiro</h1>
          <p className="text-sm text-[#9a7d50] mt-1 capitalize">{nomeMes}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border border-[#B89968]/30 rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
          />
          {!carregando && (
            <>
              <button
                onClick={exportarCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] hover:bg-[#faf5ee] transition-colors"
              >
                <Download size={14} />
                CSV
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] hover:bg-[#faf5ee] transition-colors"
              >
                <Printer size={14} />
                Imprimir
              </button>
            </>
          )}
        </div>
      </div>

      {/* DRE simplificado */}
      <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-[#9a7d50] uppercase tracking-wider mb-4">DRE — Demonstrativo do Resultado</h2>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-2 border-b border-[#e8dcc4]">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-sm text-[#5a4530]">(+) Receita Bruta</span>
            </div>
            <span className="text-sm font-semibold text-green-600">{fmt(totalReceitas)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#e8dcc4]">
            <div className="flex items-center gap-2 pl-4">
              <span className="text-xs text-[#9a7d50]">Recebido</span>
            </div>
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
            <div className="flex items-center gap-2">
              <DollarSign size={15} className={lucro >= 0 ? "text-[#B89968]" : "text-red-500"} />
              <span className="text-sm font-semibold text-[#5a4530]">Lucro Líquido (caixa)</span>
            </div>
            <span className={`text-lg font-bold ${lucro >= 0 ? "text-[#B89968]" : "text-red-500"}`}>{fmt(lucro)}</span>
          </div>
          <div className="flex items-center justify-between py-2 text-xs text-[#9a7d50]">
            <span>Lucro ajustado (após pagar todas as comissões)</span>
            <span className={lucroAjustado >= 0 ? "text-[#9a7d50]" : "text-red-400"}>{fmt(lucroAjustado)}</span>
          </div>
        </div>
      </div>

      {/* Breakdown por forma de pagamento */}
      {!carregando && breakdownFormas.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-[#9a7d50] uppercase tracking-wider mb-4">Receita por forma de pagamento</h2>
          <div className="flex flex-wrap gap-3">
            {breakdownFormas.map(({ label, valor, pct }) => (
              <div key={label} className="flex-1 min-w-[100px] bg-[#faf5ee] rounded-xl p-3 text-center">
                <p className="text-xs text-[#9a7d50] mb-1">{label}</p>
                <p className="text-sm font-bold text-[#5a4530]">{fmt(valor)}</p>
                <p className="text-xs font-semibold text-[#B89968] mt-0.5">{pct.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {carregando ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Receitas por categoria */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#5a4530] mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-green-600" />
              Receitas por categoria
            </h3>
            {Object.entries(receitasPorCat).length === 0 ? (
              <p className="text-sm text-[#9a7d50]">Nenhuma receita registrada.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(receitasPorCat)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, valor]) => {
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

          {/* Despesas por categoria */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#5a4530] mb-3 flex items-center gap-2">
              <TrendingDown size={14} className="text-red-500" />
              Despesas operacionais por categoria
            </h3>
            {Object.entries(despesasPorCat).length === 0 ? (
              <p className="text-sm text-[#9a7d50]">Nenhuma despesa registrada.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(despesasPorCat)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, valor]) => {
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

          {/* Comissões por profissional */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#5a4530] mb-3 flex items-center gap-2">
              <Wallet size={14} className="text-amber-500" />
              Comissões por profissional
            </h3>
            {Object.entries(comissoesPorProf).length === 0 ? (
              <p className="text-sm text-[#9a7d50]">Nenhuma comissão no mês.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(comissoesPorProf)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([nome, info]) => {
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
      )}
    </div>
  );
}
