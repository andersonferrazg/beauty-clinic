"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Users, Star, Clock, Calendar, Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

type Profissional = { id: string; nome: string; cor: string };
type DadosProf = { atendimentos: number; faturamento: number; despesas: number; horas: number; clientes: Set<string>; servicos: Record<string, number> };

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function dataParaISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Periodo = "mes_atual" | "semana_atual" | "hoje" | "mes_passado" | "personalizado";

function calcularPeriodo(tipo: Periodo, dataInicio: string, dataFim: string): { inicio: Date; fim: Date } {
  const hoje = new Date();
  if (tipo === "hoje") {
    return { inicio: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()), fim: hoje };
  }
  if (tipo === "semana_atual") {
    const dom = new Date(hoje);
    dom.setDate(hoje.getDate() - hoje.getDay());
    const sab = new Date(dom);
    sab.setDate(dom.getDate() + 6);
    return { inicio: dom, fim: sab };
  }
  if (tipo === "mes_atual") {
    return {
      inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
      fim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0),
    };
  }
  if (tipo === "mes_passado") {
    const m = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
    const y = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
    return {
      inicio: new Date(y, m, 1),
      fim: new Date(y, m + 1, 0),
    };
  }
  // personalizado
  return { inicio: new Date(dataInicio), fim: new Date(dataFim) };
}

function diasNoPeriodo(inicio: Date, fim: Date): Date[] {
  const dias: Date[] = [];
  const d = new Date(inicio);
  while (d <= fim) {
    dias.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

function formatarHorasMin(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h${pad(m)}` : `${h}:00`;
}

export default function RelatorioPerformancePage() {
  const [aba, setAba] = useState<"empresa" | "profissionais">("empresa");
  const [periodo, setPeriodo] = useState<Periodo>("mes_atual");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [dados, setDados] = useState<Record<string, DadosProf>>({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/profissionais").then((r) => r.json()).then(setProfissionais);
  }, []);

  useEffect(() => {
    if (profissionais.length === 0) return;
    if (periodo === "personalizado" && (!dataInicio || !dataFim)) return;

    setCarregando(true);

    const { inicio, fim } = calcularPeriodo(periodo, dataInicio, dataFim);
    const dias = diasNoPeriodo(inicio, fim);

    Promise.all(
      dias.map((dia) =>
        fetch(`/api/agendamentos?data=${dataParaISO(dia)}`).then((r) => r.json())
      )
    ).then((results) => {
      const todos = results.flat().filter((a: { cliente: unknown }) => a.cliente);
      const resumo: Record<string, DadosProf> = {};

      for (const prof of profissionais) {
        resumo[prof.id] = { atendimentos: 0, faturamento: 0, despesas: 0, horas: 0, clientes: new Set(), servicos: {} };
      }

      for (const ag of todos as {
        profissionalId: string;
        clienteId: string;
        inicio: string;
        fim: string;
        itens: { servico: { nome: string }; preco: number }[];
      }[]) {
        if (!resumo[ag.profissionalId]) continue;
        resumo[ag.profissionalId].atendimentos++;
        resumo[ag.profissionalId].clientes.add(ag.clienteId);
        const durMin = (new Date(ag.fim).getTime() - new Date(ag.inicio).getTime()) / 60000;
        resumo[ag.profissionalId].horas += durMin;
        for (const item of ag.itens) {
          resumo[ag.profissionalId].faturamento += item.preco;
          const svc = item.servico.nome;
          resumo[ag.profissionalId].servicos[svc] = (resumo[ag.profissionalId].servicos[svc] || 0) + 1;
        }
      }

      setDados(resumo);
    }).finally(() => setCarregando(false));
  }, [profissionais, periodo, dataInicio, dataFim]);

  const { inicio: periodoInicio, fim: periodoFim } = calcularPeriodo(periodo, dataInicio, dataFim);

  const totalAtendimentos = Object.values(dados).reduce((s, d) => s + d.atendimentos, 0);
  const totalFaturamento = Object.values(dados).reduce((s, d) => s + d.faturamento, 0);
  const totalDespesas = Object.values(dados).reduce((s, d) => s + d.despesas, 0);
  const totalLucro = totalFaturamento - totalDespesas;
  const totalClientesSet = new Set(Object.values(dados).flatMap((d) => [...d.clientes]));
  const totalHorasMin = Object.values(dados).reduce((s, d) => s + d.horas, 0);
  const diasPeriodo = diasNoPeriodo(periodoInicio, periodoFim).length;

  function exportarCSV() {
    const { inicio, fim } = calcularPeriodo(periodo, dataInicio, dataFim);
    const linhas: string[][] = [];

    if (aba === "profissionais") {
      linhas.push(["Profissional", "Atendimentos", "Faturamento (R$)", "Ticket Médio (R$)", "Clientes únicos", "Horas"]);
      for (const prof of profissionais) {
        const d = dados[prof.id];
        if (!d) continue;
        const ticket = d.atendimentos > 0 ? d.faturamento / d.atendimentos : 0;
        linhas.push([
          prof.nome,
          String(d.atendimentos),
          d.faturamento.toFixed(2),
          ticket.toFixed(2),
          String(d.clientes.size),
          formatarHorasMin(d.horas),
        ]);
      }
      linhas.push([
        "TOTAL",
        String(totalAtendimentos),
        totalFaturamento.toFixed(2),
        totalAtendimentos > 0 ? (totalFaturamento / totalAtendimentos).toFixed(2) : "0",
        String(totalClientesSet.size),
        formatarHorasMin(totalHorasMin),
      ]);
    } else {
      linhas.push(["Indicador", "Valor"]);
      linhas.push(["Período", `${inicio.toLocaleDateString("pt-BR")} → ${fim.toLocaleDateString("pt-BR")}`]);
      linhas.push(["Receita (R$)", totalFaturamento.toFixed(2)]);
      linhas.push(["Despesas (R$)", totalDespesas.toFixed(2)]);
      linhas.push(["Lucro (R$)", totalLucro.toFixed(2)]);
      linhas.push(["Atendimentos", String(totalAtendimentos)]);
      linhas.push(["Clientes únicos", String(totalClientesSet.size)]);
      linhas.push(["Dias no período", String(diasPeriodo)]);
      linhas.push(["Horas trabalhadas", formatarHorasMin(totalHorasMin)]);
    }

    const csv = linhas.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${aba}-${inicio.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const PERIODOS: { id: Periodo; label: string }[] = [
    { id: "mes_atual", label: "MÊS ATUAL" },
    { id: "semana_atual", label: "SEMANA ATUAL" },
    { id: "hoje", label: "HOJE" },
    { id: "mes_passado", label: "MÊS PASSADO" },
    { id: "personalizado", label: "PERSONALIZADO" },
  ];

  return (
    <div className="p-6">
      {/* Abas */}
      <div className="flex gap-6 border-b border-[#e8dcc4] mb-5">
        {(["empresa", "profissionais"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={cn(
              "pb-3 text-sm font-semibold uppercase tracking-wide transition-colors",
              aba === a
                ? "text-[#B89968] border-b-2 border-[#B89968]"
                : "text-[#9a7d50] hover:text-[#5a4530]"
            )}
          >
            {a === "empresa" ? "Empresa" : "Profissionais"}
          </button>
        ))}
      </div>

      {/* Filtros de período */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors",
              periodo === p.id
                ? "bg-[#B89968] text-white"
                : "bg-white border border-[#e8dcc4] text-[#9a7d50] hover:border-[#B89968]/40 hover:text-[#5a4530]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Datas personalizadas */}
      {periodo === "personalizado" && (
        <div className="flex gap-3 mb-4 items-center">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="border border-[#B89968]/30 rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
          />
          <span className="text-[#9a7d50] text-sm">→</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="border border-[#B89968]/30 rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
          />
        </div>
      )}

      {/* Range do período + exportação */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-[#9a7d50]">
          {periodoInicio.toLocaleDateString("pt-BR")} → {periodoFim.toLocaleDateString("pt-BR")}
        </p>
        {!carregando && (
          <div className="flex gap-2">
            <button
              onClick={exportarCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B89968]/40 text-xs font-medium text-[#9a7d50] hover:bg-[#faf5ee] hover:text-[#5a4530] transition-colors"
            >
              <Download size={13} /> Exportar CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B89968]/40 text-xs font-medium text-[#9a7d50] hover:bg-[#faf5ee] hover:text-[#5a4530] transition-colors"
            >
              <Printer size={13} /> Imprimir
            </button>
          </div>
        )}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : (
        <>
          {/* ── ABA EMPRESA ─────────────────────────────────────────────── */}
          {aba === "empresa" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Balanço financeiro */}
                <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#5a4530] mb-4">Balanço financeiro no período</h3>
                  {/* Gráfico de barras simples */}
                  <div className="flex items-end gap-4 h-28 mb-3">
                    {[
                      { label: "Receita", valor: totalFaturamento, cor: "#22c55e" },
                      { label: "Despesa", valor: totalDespesas, cor: "#ef4444" },
                    ].map((item) => {
                      const max = Math.max(totalFaturamento, totalDespesas, 1);
                      const pct = (item.valor / max) * 100;
                      return (
                        <div key={item.label} className="flex flex-col items-center gap-1 flex-1">
                          <span className="text-xs font-semibold" style={{ color: item.cor }}>
                            {fmt(item.valor)}
                          </span>
                          <div className="w-full rounded-t-md" style={{ height: `${Math.max(pct * 0.8, 4)}px`, backgroundColor: item.cor }} />
                        </div>
                      );
                    })}
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <span className={cn("text-xs font-semibold", totalLucro >= 0 ? "text-[#B89968]" : "text-red-500")}>
                        {fmt(totalLucro)}
                      </span>
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max((Math.abs(totalLucro) / Math.max(totalFaturamento, 1)) * 80, 4)}px`,
                          backgroundColor: totalLucro >= 0 ? "#B89968" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-around text-xs text-[#9a7d50] border-t border-[#e8dcc4] pt-2">
                    <span className="text-green-600 font-medium">Receita</span>
                    <span className="text-red-500 font-medium">Despesa</span>
                    <span className="text-[#B89968] font-medium">Lucro</span>
                  </div>
                </div>

                {/* Resumo de esforço */}
                <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#5a4530] mb-4">Resumo esforço do período</h3>
                  <div className="space-y-3">
                    {[
                      { icon: <Calendar size={18} className="text-[#B89968]" />, valor: diasPeriodo, label: "dias" },
                      { icon: <Users size={18} className="text-[#B89968]" />, valor: totalAtendimentos, label: "atendimentos" },
                      { icon: <Users size={18} className="text-green-600" />, valor: totalClientesSet.size, label: "clientes atendidos" },
                      { icon: <Clock size={18} className="text-[#B89968]" />, valor: formatarHorasMin(totalHorasMin), label: "horas" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-xl font-bold text-[#5a4530]">{item.valor}</span>
                        <span className="text-sm text-[#9a7d50]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Totais rápidos */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Faturamento total", valor: fmt(totalFaturamento), cor: "text-green-600" },
                  { label: "Ticket médio", valor: totalAtendimentos > 0 ? fmt(totalFaturamento / totalAtendimentos) : "R$ 0,00", cor: "text-[#B89968]" },
                  { label: "Atendimentos", valor: String(totalAtendimentos), cor: "text-[#5a4530]" },
                ].map((card) => (
                  <div key={card.label} className="bg-white rounded-xl border border-[#e8dcc4] p-4 shadow-sm text-center">
                    <p className="text-xs text-[#9a7d50] mb-1">{card.label}</p>
                    <p className={cn("text-lg font-bold", card.cor)}>{card.valor}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ABA PROFISSIONAIS ──────────────────────────────────────── */}
          {aba === "profissionais" && (
            <div className="space-y-5">
              {profissionais.map((prof) => {
                const d = dados[prof.id] || { atendimentos: 0, faturamento: 0, horas: 0, clientes: new Set(), servicos: {} };
                const topServicos = Object.entries(d.servicos).sort(([, a], [, b]) => b - a).slice(0, 3);
                const ticketMedio = d.atendimentos > 0 ? d.faturamento / d.atendimentos : 0;

                return (
                  <div key={prof.id} className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: prof.cor }}
                      >
                        {prof.nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#5a4530]">{prof.nome}</p>
                        <p className="text-xs text-[#9a7d50]">Performance do período</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        { label: "Atendimentos", valor: String(d.atendimentos), cor: "text-[#5a4530]" },
                        { label: "Faturamento", valor: fmt(d.faturamento), cor: "text-green-600" },
                        { label: "Ticket médio", valor: fmt(ticketMedio), cor: "text-[#B89968]" },
                        { label: "Horas trabalhadas", valor: formatarHorasMin(d.horas), cor: "text-[#9a7d50]" },
                      ].map((card) => (
                        <div key={card.label} className="bg-[#faf5ee] rounded-lg p-3 text-center">
                          <p className="text-[10px] text-[#9a7d50] mb-0.5">{card.label}</p>
                          <p className={cn("text-sm font-bold", card.cor)}>{card.valor}</p>
                        </div>
                      ))}
                    </div>

                    {topServicos.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-2">Top serviços</p>
                        <div className="flex flex-wrap gap-2">
                          {topServicos.map(([nome, qtd]) => (
                            <span key={nome} className="flex items-center gap-1 bg-[#f5f0e8] text-[#5a4530] text-xs px-2.5 py-1 rounded-full">
                              <Star size={10} className="text-[#B89968]" />
                              {nome} ({qtd}x)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
