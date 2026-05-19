"use client";

import { useEffect, useState } from "react";
import { Loader2, ClipboardList, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type Agendamento = {
  id: string;
  inicio: string;
  valorTotal: number | null;
  formaPagamento: string | null;
  cliente: { nome: string } | null;
  profissional: { nome: string; cor: string };
  status: { nome: string; cor: string } | null;
  itens: { servico: { nome: string }; preco: number }[];
};

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ComandasPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mes, setMes] = useState(mesAtual());

  useEffect(() => {
    setCarregando(true);
    const [ano, m] = mes.split("-");
    const daysInMonth = new Date(parseInt(ano), parseInt(m), 0).getDate();
    // Buscar todos os dias do mês
    Promise.all(
      Array.from({ length: daysInMonth }, (_, i) => {
        const dia = String(i + 1).padStart(2, "0");
        return fetch(`/api/agendamentos?data=${ano}-${m}-${dia}`).then((r) => r.json());
      })
    ).then((results) => {
      const todos = results.flat().filter((a: Agendamento) => a.cliente);
      setAgendamentos(todos.sort((a: Agendamento, b: Agendamento) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()));
    }).finally(() => setCarregando(false));
  }, [mes]);

  const totalFaturado = agendamentos.reduce((s, a) => {
    const total = a.itens.reduce((sum, i) => sum + i.preco, 0);
    return s + total;
  }, 0);

  const [anoMes, mesNum] = mes.split("-");
  const nomeMes = new Date(parseInt(anoMes), parseInt(mesNum) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Comandas</h1>
          <p className="text-sm text-[#9a7d50] mt-1 capitalize">{nomeMes}</p>
        </div>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="border border-[#B89968]/30 rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
        />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 shadow-sm">
          <p className="text-xs text-[#9a7d50] mb-1">Atendimentos</p>
          <p className="text-2xl font-bold text-[#5a4530]">{agendamentos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 shadow-sm">
          <p className="text-xs text-[#9a7d50] mb-1">Total faturado</p>
          <p className="text-xl font-bold text-[#B89968]">{fmt(totalFaturado)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 shadow-sm">
          <p className="text-xs text-[#9a7d50] mb-1">Ticket médio</p>
          <p className="text-xl font-bold text-[#5a4530]">
            {agendamentos.length > 0 ? fmt(totalFaturado / agendamentos.length) : "—"}
          </p>
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="text-center py-20 text-[#9a7d50]">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum atendimento neste mês.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Data</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Serviços</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Profissional</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Pagamento</th>
                <th className="text-right px-4 py-3 text-[#9a7d50] font-medium">Total</th>
                <th className="text-center px-4 py-3 text-[#9a7d50] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((ag, i) => {
                const total = ag.itens.reduce((s, item) => s + item.preco, 0);
                return (
                  <tr
                    key={ag.id}
                    className={cn(
                      "border-b border-[#e8dcc4] hover:bg-[#faf5ee] transition-colors",
                      i === agendamentos.length - 1 ? "border-b-0" : ""
                    )}
                  >
                    <td className="px-4 py-3 text-[#5a4530] whitespace-nowrap">
                      {new Date(ag.inicio).toLocaleDateString("pt-BR")}
                      <span className="text-[#9a7d50] text-xs ml-1">
                        {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#5a4530]">
                      {ag.cliente?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#5a4530]">
                      <div className="flex flex-wrap gap-1">
                        {ag.itens.map((item, j) => (
                          <span key={j} className="text-xs bg-[#f5f0e8] text-[#9a7d50] px-1.5 py-0.5 rounded">
                            {item.servico.nome}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ag.profissional.cor }} />
                        {ag.profissional.nome.split(" ")[0]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9a7d50] text-xs">
                      {ag.formaPagamento ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#5a4530]">
                      {fmt(total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ag.status ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: ag.status.cor }}
                        >
                          {ag.status.nome}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#e8dcc4] bg-[#faf5ee]">
                <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-[#5a4530]">Total do mês</td>
                <td className="px-4 py-3 text-right font-bold text-[#B89968]">{fmt(totalFaturado)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
