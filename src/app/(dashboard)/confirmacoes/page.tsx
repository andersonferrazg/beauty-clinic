"use client";

import { useEffect, useState } from "react";
import { Loader2, Send, CheckCircle2, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Agendamento = {
  id: string;
  inicio: string;
  fim: string;
  profissional: { id: string; nome: string; cor: string };
  cliente: { id: string; nome: string; telefone1: string | null } | null;
  status: { nome: string; cor: string } | null;
  itens: { servico: { nome: string } | null }[];
  confirmacaoManualPendente: boolean;
};

const TEMPLATE_PADRAO = `Oii {primeiro_nome} 💖

Passando para confirmar nosso horário amanhã ({dia_semana}) {data_curta} ás {hora}h

Por gentileza, confirme o recebimento desta mensagem. Caso não haja resposta, o seu horário será automaticamente cancelado.
Tolerância de atraso é de 10 minutos.

Agradeço a compreensão 🥰`;

function formatarDiaSemana(iso: string) {
  const d = new Date(iso);
  const dia = d.toLocaleDateString("pt-BR", { weekday: "long" });
  return dia.charAt(0).toUpperCase() + dia.slice(1);
}

function formatarDataCurta(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatarHora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatarDataISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function gerarLinkWA(telefone: string, mensagem: string) {
  const numero = telefone.replace(/\D/g, "");
  const comDDI = numero.startsWith("55") ? numero : `55${numero}`;
  const texto = encodeURIComponent(mensagem);
  const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  // Mobile: scheme direto ao app (preserva emoji). Desktop: WhatsApp Web (preserva emoji no browser)
  return isMobile
    ? `whatsapp://send?phone=${comDDI}&text=${texto}`
    : `https://web.whatsapp.com/send?phone=${comDDI}&text=${texto}`;
}

function preencherTemplate(ag: Agendamento, tmpl: string) {
  const nomeCompleto = ag.cliente?.nome ?? "Cliente";
  const primeiroNome = nomeCompleto.split(" ")[0];
  const diaSemana = formatarDiaSemana(ag.inicio);
  const dataCurta = formatarDataCurta(ag.inicio);
  const hora = formatarHora(ag.inicio);

  return tmpl
    .replace(/\{primeiro_nome\}/g, primeiroNome)
    .replace(/\{dia_semana\}/g, diaSemana)
    .replace(/\{data_curta\}/g, dataCurta)
    .replace(/\{hora\}/g, hora);
}

function IconeWhatsApp({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.123 1.523 5.855L0 24l6.335-1.506A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.504-5.17-1.385l-.37-.217-3.763.895.946-3.661-.24-.383A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

export default function ConfirmacoesPage() {
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const [data, setData] = useState(amanha);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState(TEMPLATE_PADRAO);

  useEffect(() => {
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.mensagemConfirmacaoWpp) setTemplate(d.config.mensagemConfirmacaoWpp);
      });
  }, []);

  const dataStr = formatarDataISO(data);

  useEffect(() => {
    setCarregando(true);
    fetch(`/api/agendamentos?data=${dataStr}`)
      .then((r) => r.json())
      .then((dados) => {
        const lista: Agendamento[] = Array.isArray(dados) ? dados : [];
        setAgendamentos(lista);
        setEnviados(new Set(lista.filter((ag) => ag.confirmacaoManualPendente).map((ag) => ag.id)));
      })
      .finally(() => setCarregando(false));
  }, [dataStr]);

  function navegar(delta: number) {
    const nova = new Date(data);
    nova.setDate(nova.getDate() + delta);
    setData(nova);
  }

  const agendamentosComCliente = agendamentos.filter(
    (ag) => ag.cliente && ag.cliente.telefone1
  );

  const totalEnviados = agendamentosComCliente.filter((ag) => enviados.has(ag.id)).length;

  const grupos = agendamentosComCliente.reduce<Record<string, Agendamento[]>>((acc, ag) => {
    const nome = ag.profissional.nome;
    if (!acc[nome]) acc[nome] = [];
    acc[nome].push(ag);
    return acc;
  }, {});

  const dataPorExtenso = data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold text-[#5a4530] flex items-center gap-2">
          <IconeWhatsApp size={22} />
          Confirmações WhatsApp
        </h1>
        <p className="text-sm text-[#9a7d50] mt-1">
          Envie confirmações para as clientes do dia selecionado
        </p>
      </div>

      {/* Seletor de data */}
      <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 mb-5 flex items-center justify-between">
        <button
          onClick={() => navegar(-1)}
          className="p-2 rounded-lg hover:bg-[#faf5ee] text-[#9a7d50] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#5a4530] capitalize">{dataPorExtenso}</p>
          {formatarDataISO(amanha) === dataStr && (
            <span className="text-xs bg-[#B89968]/15 text-[#B89968] px-2 py-0.5 rounded-full font-medium">
              amanhã
            </span>
          )}
          {formatarDataISO(hoje) === dataStr && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              hoje
            </span>
          )}
        </div>
        <button
          onClick={() => navegar(1)}
          className="p-2 rounded-lg hover:bg-[#faf5ee] text-[#9a7d50] transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Progresso */}
      {agendamentosComCliente.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="text-sm text-emerald-800">
              <strong>{totalEnviados}</strong> de <strong>{agendamentosComCliente.length}</strong> mensagens abertas
            </span>
          </div>
          {totalEnviados === agendamentosComCliente.length && totalEnviados > 0 && (
            <span className="text-xs text-emerald-700 font-medium">Todas enviadas! ✓</span>
          )}
        </div>
      )}

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : agendamentosComCliente.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e8dcc4] py-16 text-center text-[#9a7d50]">
          <IconeWhatsApp size={36} />
          <p className="text-sm mt-3">
            {agendamentos.length === 0
              ? "Nenhum agendamento neste dia."
              : "Nenhum agendamento com telefone cadastrado neste dia."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grupos).map(([nomeProfissional, lista]) => {
            const prof = lista[0].profissional;
            return (
              <div key={nomeProfissional} className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
                {/* Header profissional */}
                <div className="px-4 py-3 border-b border-[#e8dcc4] flex items-center gap-3 bg-[#faf5ee]/50">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: prof.cor }}
                  >
                    {nomeProfissional.replace("Dra. ", "").charAt(0).toUpperCase()}
                  </div>
                  <p className="font-semibold text-[#5a4530] text-sm">{nomeProfissional}</p>
                  <span className="ml-auto text-xs text-[#9a7d50]">
                    {lista.length} cliente{lista.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Linhas */}
                <div className="divide-y divide-[#e8dcc4]/60">
                  {lista
                    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
                    .map((ag) => {
                      const enviado = enviados.has(ag.id);
                      const mensagem = preencherTemplate(ag, template);
                      const link = gerarLinkWA(ag.cliente!.telefone1!, mensagem);
                      const servico = ag.itens[0]?.servico?.nome ?? "Consulta";

                      return (
                        <div
                          key={ag.id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 transition-colors",
                            enviado ? "bg-emerald-50/50" : "hover:bg-[#faf5ee]/50"
                          )}
                        >
                          {/* Hora */}
                          <div className="text-center flex-shrink-0 w-12">
                            <p className="text-sm font-bold text-[#5a4530]">{formatarHora(ag.inicio)}</p>
                            <p className="text-[10px] text-[#9a7d50]">{formatarHora(ag.fim)}</p>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#5a4530] text-sm truncate">{ag.cliente!.nome}</p>
                            <p className="text-xs text-[#9a7d50] truncate">{servico}</p>
                            <p className="text-[10px] text-[#9a7d50]/70 flex items-center gap-1 mt-0.5">
                              <Phone size={9} /> {ag.cliente!.telefone1}
                            </p>
                          </div>

                          {/* Botão WA */}
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              setEnviados((prev) => new Set(prev).add(ag.id));
                              fetch(`/api/agendamentos/${ag.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ confirmacaoManualPendente: true }),
                              }).catch(() => {});
                            }}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0",
                              enviado
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-sm"
                            )}
                          >
                            {enviado ? (
                              <><CheckCircle2 size={15} /> Enviado</>
                            ) : (
                              <><Send size={14} /> Enviar</>
                            )}
                          </a>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dica */}
      <p className="text-xs text-[#9a7d50] text-center mt-6">
        Ao clicar em &quot;Enviar&quot;, o WhatsApp abre com a mensagem pronta. Basta pressionar enviar no app.
      </p>
    </div>
  );
}
