"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, TrendingUp, TrendingDown, DollarSign, Wallet,
  Calendar, AlertCircle, Cake, ChevronRight, Users, Building2, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AgendamentoHoje = {
  id: string;
  inicio: string;
  fim: string;
  valorTotal: number | null;
  cliente: { id: string; nome: string } | null;
  profissional: { id: string; nome: string; cor: string };
  status: { nome: string; cor: string; contaConfirmado: boolean } | null;
  itens: { servico: { nome: string } | null }[];
};

type ContaVencendo = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  categoria: string | null;
  tipo: string;
};

type Aniversariante = {
  id: string;
  nome: string;
  dataNascimento: string;
  telefone1: string | null;
};

type FaturamentoProfissional = {
  profissionalId: string;
  nome: string;
  cor: string;
  receita: number;
};

type DashboardData = {
  isAdmin: boolean;
  nomeUsuario: string;
  agendamentosHoje: AgendamentoHoje[];
  resumoMes: { receita: number; despesa: number; lucro: number } | null;
  gastosClinicaMes: number;
  gastosPessoalMes: number;
  comissoesPendentes: { total: number; count: number } | null;
  contasVencendo: ContaVencendo[];
  aniversariantesMes: Aniversariante[];
  faturamentoPorProfissional: FaturamentoProfissional[];
  comissaoMesProfissional: { total: number; pendente: number } | null;
  atendimentosMes: number | null;
};

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function diaMes(iso: string) {
  const d = new Date(iso);
  return d.getDate();
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function dataPorExtenso() {
  const d = new Date();
  const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function DashboardPage() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setDados)
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-[#B89968]" />
      </div>
    );
  }

  if (!dados) return null;

  const { isAdmin, nomeUsuario, agendamentosHoje, resumoMes,
    gastosClinicaMes = 0, gastosPessoalMes = 0,
    comissoesPendentes, contasVencendo, aniversariantesMes,
    faturamentoPorProfissional, comissaoMesProfissional, atendimentosMes } = dados;

  // Gastos Pessoal é separado e NÃO entra no resultado da clínica
  const lucroClinica = (resumoMes?.receita ?? 0) - gastosClinicaMes;

  const maxReceita = faturamentoPorProfissional.length > 0
    ? Math.max(...faturamentoPorProfissional.map((p) => p.receita))
    : 1;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-serif text-[#5a4530]">
          {saudacao()}, {nomeUsuario.split(" ")[0]}!
        </h1>
        <p className="text-sm text-[#9a7d50] mt-0.5">{dataPorExtenso()}</p>
      </div>

      {/* ── KPIs admin ─────────────────────────────────────────────────────────── */}
      {isAdmin && resumoMes && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-emerald-600" />
              </div>
              <span className="text-xs text-[#9a7d50] uppercase tracking-wider">Receita mês</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{fmt(resumoMes.receita)}</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown size={16} className="text-red-500" />
              </div>
              <span className="text-xs text-[#9a7d50] uppercase tracking-wider">Despesas mês</span>
            </div>
            <p className="text-xl font-bold text-red-500">{fmt(gastosClinicaMes)}</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                lucroClinica >= 0 ? "bg-[#faf5ee]" : "bg-red-100"
              )}>
                <DollarSign size={16} className={lucroClinica >= 0 ? "text-[#B89968]" : "text-red-500"} />
              </div>
              <span className="text-xs text-[#9a7d50] uppercase tracking-wider">Lucro clínica</span>
            </div>
            <p className={cn("text-xl font-bold", lucroClinica >= 0 ? "text-[#5a4530]" : "text-red-500")}>
              {fmt(lucroClinica)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Wallet size={16} className="text-amber-600" />
              </div>
              <span className="text-xs text-[#9a7d50] uppercase tracking-wider">Comissões pend.</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{fmt(comissoesPendentes?.total ?? 0)}</p>
            {(comissoesPendentes?.count ?? 0) > 0 && (
              <p className="text-xs text-[#9a7d50] mt-0.5">{comissoesPendentes!.count} pendente(s)</p>
            )}
          </div>
        </div>
      )}

      {/* ── Comparativo: receita vs gastos ────────────────────────────────────── */}
      {isAdmin && resumoMes && (
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-[#B89968]" />
            <h2 className="font-semibold text-[#5a4530] text-sm">
              Comparativo — {MESES[new Date().getMonth()]}
            </h2>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="text-sm text-[#9a7d50]">Receita atendimentos</span>
              </div>
              <span className="text-sm font-semibold text-emerald-600">{fmt(resumoMes.receita)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-red-400" />
                <span className="text-sm text-[#9a7d50]">Gastos Clínica</span>
              </div>
              <span className="text-sm font-semibold text-red-500">- {fmt(gastosClinicaMes)}</span>
            </div>
            <div className="border-t border-[#e8dcc4] pt-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#5a4530]">Resultado da Clínica</span>
                <span className={cn(
                  "text-base font-bold",
                  lucroClinica >= 0 ? "text-emerald-600" : "text-red-500"
                )}>
                  {fmt(lucroClinica)}
                </span>
              </div>
            </div>
            {gastosPessoalMes > 0 && (
              <div className="border-t border-dashed border-[#e8dcc4] pt-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home size={14} className="text-[#9a7d50]" />
                    <span className="text-xs text-[#9a7d50]">Gastos Pessoal (separado)</span>
                  </div>
                  <span className="text-xs text-[#9a7d50]">{fmt(gastosPessoalMes)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KPIs profissional ──────────────────────────────────────────────────── */}
      {!isAdmin && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#faf5ee] flex items-center justify-center">
                <Calendar size={16} className="text-[#B89968]" />
              </div>
              <span className="text-xs text-[#9a7d50] uppercase tracking-wider">Atendimentos mês</span>
            </div>
            <p className="text-xl font-bold text-[#5a4530]">{atendimentosMes ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Wallet size={16} className="text-amber-600" />
              </div>
              <span className="text-xs text-[#9a7d50] uppercase tracking-wider">Comissão pendente</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{fmt(comissaoMesProfissional?.pendente ?? 0)}</p>
            <p className="text-xs text-[#9a7d50] mt-0.5">total {fmt(comissaoMesProfissional?.total ?? 0)}</p>
          </div>
        </div>
      )}

      {/* ── Agenda de hoje + sidebar ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Agenda de hoje */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e8dcc4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#B89968]" />
              <h2 className="font-semibold text-[#5a4530] text-sm">Agenda de hoje</h2>
              {agendamentosHoje.length > 0 && (
                <span className="bg-[#B89968] text-white text-xs px-1.5 py-0.5 rounded-full">
                  {agendamentosHoje.length}
                </span>
              )}
            </div>
            <Link href="/agenda" className="text-xs text-[#B89968] hover:text-[#9a7d50] flex items-center gap-0.5">
              Ver agenda <ChevronRight size={13} />
            </Link>
          </div>

          {agendamentosHoje.length === 0 ? (
            <div className="py-12 text-center text-[#9a7d50]">
              <Calendar size={28} strokeWidth={1} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum agendamento para hoje.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e8dcc4]/60">
              {agendamentosHoje.map((ag) => {
                const inicio = new Date(ag.inicio);
                const fim = new Date(ag.fim);
                const hora = `${String(inicio.getHours()).padStart(2, "0")}:${String(inicio.getMinutes()).padStart(2, "0")}`;
                const horaFim = `${String(fim.getHours()).padStart(2, "0")}:${String(fim.getMinutes()).padStart(2, "0")}`;
                const servico = ag.itens[0]?.servico?.nome;

                return (
                  <div key={ag.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#faf5ee]/50">
                    <div className="text-center w-12 flex-shrink-0">
                      <p className="text-sm font-bold text-[#5a4530]">{hora}</p>
                      <p className="text-xs text-[#9a7d50]">{horaFim}</p>
                    </div>
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: ag.status?.cor ?? "#cccccc" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#5a4530] truncate">
                        {ag.cliente?.nome ?? "Bloqueio"}
                      </p>
                      <p className="text-xs text-[#9a7d50] truncate">
                        {servico ?? "—"}
                        {isAdmin && ` · ${ag.profissional.nome}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ag.status && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${ag.status.cor}22`, color: ag.status.cor }}
                        >
                          {ag.status.nome}
                        </span>
                      )}
                      {ag.valorTotal != null && ag.valorTotal > 0 && (
                        <span className="text-xs font-semibold text-[#5a4530]">{fmt(ag.valorTotal)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna lateral: contas + aniversários */}
        <div className="space-y-4">

          {/* Contas vencendo */}
          {isAdmin && (
            <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e8dcc4] flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400" />
                <h2 className="font-semibold text-[#5a4530] text-sm">Vence em 7 dias</h2>
              </div>
              {contasVencendo.length === 0 ? (
                <p className="text-xs text-[#9a7d50] text-center py-6">Nenhuma conta vencendo.</p>
              ) : (
                <div className="divide-y divide-[#e8dcc4]/60">
                  {contasVencendo.map((c) => {
                    const venc = new Date(c.vencimento);
                    const hoje2 = new Date(); hoje2.setHours(0, 0, 0, 0);
                    const diff = Math.ceil((venc.getTime() - hoje2.getTime()) / 86400000);
                    return (
                      <div key={c.id} className="px-4 py-2.5 flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold",
                          diff === 0 ? "bg-red-100 text-red-600" :
                          diff <= 2 ? "bg-orange-100 text-orange-600" :
                          "bg-amber-50 text-amber-600"
                        )}>
                          {diff === 0 ? "Hj" : `${diff}d`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#5a4530] truncate">{c.descricao}</p>
                          <p className="text-xs text-[#9a7d50]">{venc.toLocaleDateString("pt-BR")}</p>
                        </div>
                        <span className="text-xs font-semibold text-red-500 flex-shrink-0">{fmt(c.valor)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Aniversariantes do mês */}
          {isAdmin && (
            <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e8dcc4] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cake size={15} className="text-pink-400" />
                  <h2 className="font-semibold text-[#5a4530] text-sm">Aniversariantes</h2>
                </div>
                <span className="text-xs text-[#9a7d50]">{MESES[new Date().getMonth()]}</span>
              </div>
              {aniversariantesMes.length === 0 ? (
                <p className="text-xs text-[#9a7d50] text-center py-6">Nenhum aniversariante.</p>
              ) : (
                <div className="divide-y divide-[#e8dcc4]/60">
                  {aniversariantesMes.map((c) => {
                    const hoje2 = new Date();
                    const ehHoje = new Date(c.dataNascimento).getDate() === hoje2.getDate();
                    return (
                      <div key={c.id} className={cn("px-4 py-2.5 flex items-center gap-3", ehHoje && "bg-pink-50/50")}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white",
                          ehHoje ? "bg-pink-400" : "bg-[#B89968]"
                        )}>
                          {diaMes(c.dataNascimento)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#5a4530] truncate">{c.nome}</p>
                          {ehHoje && <p className="text-xs text-pink-500 font-medium">🎂 Hoje!</p>}
                        </div>
                        {c.telefone1 && (
                          <a
                            href={`https://wa.me/55${c.telefone1.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-emerald-600 hover:text-emerald-700"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Faturamento por profissional ───────────────────────────────────────── */}
      {isAdmin && faturamentoPorProfissional.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e8dcc4] flex items-center gap-2">
            <Users size={15} className="text-[#B89968]" />
            <h2 className="font-semibold text-[#5a4530] text-sm">Faturamento por profissional — {MESES[new Date().getMonth()]}</h2>
          </div>
          <div className="p-4 space-y-3">
            {faturamentoPorProfissional.map((p) => (
              <div key={p.profissionalId} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: p.cor }}
                >
                  {p.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#5a4530]">{p.nome}</span>
                    <span className="text-xs font-semibold text-[#5a4530]">{fmt(p.receita)}</span>
                  </div>
                  <div className="h-2 bg-[#faf5ee] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(p.receita / maxReceita) * 100}%`, backgroundColor: p.cor }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
