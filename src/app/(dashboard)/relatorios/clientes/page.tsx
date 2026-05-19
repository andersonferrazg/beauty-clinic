"use client";

import { useEffect, useState } from "react";
import { Loader2, Crown, Phone, Users, UserPlus, Download, TrendingUp, Calendar } from "lucide-react";

type ClienteRanking = {
  id: string;
  nome: string;
  telefone1: string | null;
  dataNascimento: Date | null;
  receita: number;
  atendimentos: number;
};

type Dados = {
  totalClientes: number;
  novosClientes: number;
  ranking: ClienteRanking[];
};

type Periodo = "mes_atual" | "mes_passado" | "3meses" | "6meses" | "12meses" | "este_ano" | "personalizado";
type Tipo = "receita" | "atendimentos";

function calcularPeriodo(p: Periodo): { inicio: string; fim: string; label: string } {
  const hoje = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (p === "mes_atual") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return { inicio: fmt(inicio), fim: fmt(fim), label: "Mês atual" };
  }
  if (p === "mes_passado") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return { inicio: fmt(inicio), fim: fmt(fim), label: "Mês passado" };
  }
  if (p === "3meses") {
    const inicio = new Date(hoje); inicio.setMonth(inicio.getMonth() - 3);
    return { inicio: fmt(inicio), fim: fmt(hoje), label: "Últimos 3 meses" };
  }
  if (p === "6meses") {
    const inicio = new Date(hoje); inicio.setMonth(inicio.getMonth() - 6);
    return { inicio: fmt(inicio), fim: fmt(hoje), label: "Últimos 6 meses" };
  }
  if (p === "12meses") {
    const inicio = new Date(hoje); inicio.setFullYear(inicio.getFullYear() - 1);
    return { inicio: fmt(inicio), fim: fmt(hoje), label: "Últimos 12 meses" };
  }
  if (p === "este_ano") {
    const inicio = new Date(hoje.getFullYear(), 0, 1);
    return { inicio: fmt(inicio), fim: fmt(hoje), label: "Este ano" };
  }
  return { inicio: fmt(hoje), fim: fmt(hoje), label: "Personalizado" };
}

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export default function RelatorioClientesPage() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("12meses");
  const [tipo, setTipo] = useState<Tipo>("receita");
  const [inicioCustom, setInicioCustom] = useState("");
  const [fimCustom, setFimCustom] = useState("");

  const periodoCalc = calcularPeriodo(periodo);
  const inicioFinal = periodo === "personalizado" ? inicioCustom : periodoCalc.inicio;
  const fimFinal = periodo === "personalizado" ? fimCustom : periodoCalc.fim;

  useEffect(() => {
    if (!inicioFinal || !fimFinal) return;
    setCarregando(true);
    fetch(`/api/relatorios/melhores-clientes?inicio=${inicioFinal}&fim=${fimFinal}&tipo=${tipo}`)
      .then((r) => r.json())
      .then(setDados)
      .finally(() => setCarregando(false));
  }, [inicioFinal, fimFinal, tipo]);

  function exportarCSV() {
    if (!dados) return;
    const linhas = [["#", "Nome", "Telefone", tipo === "receita" ? "Receita (R$)" : "Atendimentos"]];
    dados.ranking.forEach((c, i) => {
      linhas.push([
        String(i + 1),
        c.nome,
        c.telefone1 || "",
        tipo === "receita" ? c.receita.toFixed(2) : c.atendimentos.toString(),
      ]);
    });
    const csv = "﻿" + linhas.map((l) => l.map((v) => `"${v}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `melhores-clientes-${inicioFinal}-${fimFinal}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const labelPeriodo = periodo === "personalizado"
    ? (inicioFinal && fimFinal ? `${inicioFinal.split("-").reverse().join("/")} a ${fimFinal.split("-").reverse().join("/")}` : "Selecione o período")
    : periodoCalc.label;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Melhores Clientes</h1>
          <p className="text-sm text-[#9a7d50] mt-1">{labelPeriodo}</p>
        </div>
        {!carregando && dados && dados.ranking.length > 0 && (
          <button
            onClick={exportarCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] hover:bg-[#faf5ee] transition-colors"
          >
            <Download size={14} /> Exportar
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#B89968]/15 flex items-center justify-center flex-shrink-0">
            <Users size={22} className="text-[#B89968]" />
          </div>
          <div>
            <p className="text-xs text-[#9a7d50] uppercase tracking-wider mb-0.5">Total de Clientes</p>
            <p className="text-3xl font-bold text-[#5a4530]">{dados?.totalClientes ?? "—"}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <UserPlus size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-[#9a7d50] uppercase tracking-wider mb-0.5">Novos no Período</p>
            <p className="text-3xl font-bold text-emerald-600">{dados?.novosClientes ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 mb-5 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-[#9a7d50] block mb-1.5">Selecione o período</label>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as Periodo)}
            className="w-full h-9 px-3 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] bg-white focus:outline-none focus:ring-2 focus:ring-[#B89968]"
          >
            <option value="mes_atual">Mês atual</option>
            <option value="mes_passado">Mês passado</option>
            <option value="3meses">Últimos 3 meses</option>
            <option value="6meses">Últimos 6 meses</option>
            <option value="12meses">Últimos 12 meses</option>
            <option value="este_ano">Este ano</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>

        {periodo === "personalizado" && (
          <>
            <div>
              <label className="text-xs text-[#9a7d50] block mb-1.5">De</label>
              <input
                type="date"
                value={inicioCustom}
                onChange={(e) => setInicioCustom(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              />
            </div>
            <div>
              <label className="text-xs text-[#9a7d50] block mb-1.5">Até</label>
              <input
                type="date"
                value={fimCustom}
                onChange={(e) => setFimCustom(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              />
            </div>
          </>
        )}

        <div>
          <label className="text-xs text-[#9a7d50] block mb-1.5">Selecione o tipo de relatório</label>
          <div className="flex gap-1">
            <button
              onClick={() => setTipo("receita")}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium transition-colors ${
                tipo === "receita" ? "bg-[#B89968] text-white" : "bg-[#faf5ee] text-[#9a7d50] hover:bg-[#e8dcc4]"
              }`}
            >
              <TrendingUp size={13} /> Por Receita
            </button>
            <button
              onClick={() => setTipo("atendimentos")}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium transition-colors ${
                tipo === "atendimentos" ? "bg-[#B89968] text-white" : "bg-[#faf5ee] text-[#9a7d50] hover:bg-[#e8dcc4]"
              }`}
            >
              <Calendar size={13} /> Por Atendimentos
            </button>
          </div>
        </div>
      </div>

      {/* Tabela ranking */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : !dados || dados.ranking.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e8dcc4] py-16 text-center text-[#9a7d50]">
          <Users size={36} strokeWidth={1} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum atendimento finalizado no período.</p>
          <p className="text-xs mt-1 opacity-70">O ranking considera apenas atendimentos marcados como realizados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
          {/* Subtítulo da tabela */}
          <div className="px-5 py-3 bg-[#faf5ee] border-b border-[#e8dcc4]">
            <p className="text-sm text-[#5a4530] font-medium">
              Rank top {dados.ranking.length} melhores clientes por{" "}
              {tipo === "receita" ? "receita" : "atendimentos"}.{" "}
              <span className="text-[#9a7d50] font-normal">
                De {inicioFinal.split("-").reverse().join("/")} à{" "}
                {fimFinal.split("-").reverse().join("/")}
              </span>
            </p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8dcc4] bg-[#faf5ee]/50">
                <th className="text-left px-5 py-3 text-[#9a7d50] font-medium w-12">#</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium hidden sm:table-cell">Telefone</th>
                <th className="text-right px-5 py-3 text-[#9a7d50] font-medium">
                  {tipo === "receita" ? "Receita" : "Atendimentos"}
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.ranking.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-[#e8dcc4] last:border-b-0 hover:bg-[#faf5ee]/50 transition-colors"
                >
                  <td className="px-5 py-3">
                    {i === 0 ? (
                      <Crown size={16} className="text-yellow-500" />
                    ) : i === 1 ? (
                      <Crown size={16} className="text-gray-400" />
                    ) : i === 2 ? (
                      <Crown size={16} className="text-amber-700" />
                    ) : (
                      <span className="text-xs text-[#9a7d50] font-medium">{i + 1}°</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B89968] to-[#9a7d50] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#5a4530]">{c.nome}</p>
                        {tipo === "receita" && (
                          <p className="text-[10px] text-[#9a7d50]">
                            {c.atendimentos} atendimento{c.atendimentos !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {c.telefone1 ? (
                      <span className="flex items-center gap-1.5 text-[#9a7d50] text-xs">
                        <Phone size={11} />
                        {c.telefone1}
                      </span>
                    ) : (
                      <span className="text-[#9a7d50]/40 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {tipo === "receita" ? (
                      <span className="font-semibold text-[#5a4530]">{fmt(c.receita)}</span>
                    ) : (
                      <span className="font-semibold text-[#5a4530]">{c.atendimentos}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
